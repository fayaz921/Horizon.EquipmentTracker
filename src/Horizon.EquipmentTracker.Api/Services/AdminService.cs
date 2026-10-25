using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Horizon.EquipmentTracker.Api.Data;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Mapping;
using Horizon.EquipmentTracker.Api.Models.Entities;
using Horizon.EquipmentTracker.Api.Models.Enums;

namespace Horizon.EquipmentTracker.Api.Services;

/// <summary>
/// Domain service encapsulating privileged administrative operations including inspection clearance,
/// marking assets lost, and equipment catalog management (AD-6, AD-7, AD-11, Stories 5.2 & 5.4).
/// Uses EquipmentTrackerDbContext directly — no repository wrapper.
/// </summary>
public class AdminService
{
    private readonly EquipmentTrackerDbContext _db;
    private readonly ILogger<AdminService> _logger;

    public AdminService(EquipmentTrackerDbContext db, ILogger<AdminService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // -----------------------------------------------------------------------
    // Inspection Clearance (Story 5.1 / AD-7)
    // -----------------------------------------------------------------------

    /// <summary>
    /// Clears serialized equipment or counted inventory from NeedsInspection back to Available pool (AD-7, FR-20).
    /// </summary>
    public async Task<ClearInspectionResponseDto> ClearInspectionAsync(int equipmentId, ClearInspectionRequestDto request)
    {
        string? itemType = request.ItemType?.Trim().ToLowerInvariant();

        if (itemType == "counted")
        {
            return await ClearCountedInspectionAsync(equipmentId, request);
        }

        if (itemType == "serialized")
        {
            return await ClearSerializedInspectionAsync(equipmentId, request);
        }

        // Auto-detect: check serialized first
        var serialized = await _db.SerializedEquipment.FirstOrDefaultAsync(e => e.Id == equipmentId);
        if (serialized != null && serialized.Status == EquipmentStatus.NeedsInspection)
        {
            serialized.Status = EquipmentStatus.Available;
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Serialized equipment '{Name}' (Id {Id}) cleared from inspection by admin.",
                serialized.Name, serialized.Id);

            return serialized.ToClearInspectionResponseDto(request.ResolutionNotes, DateTime.UtcNow);
        }

        // Next check counted inventory
        var counted = await _db.CountedInventory.FirstOrDefaultAsync(c => c.Id == equipmentId);
        if (counted != null && counted.QuantityInInspection > 0)
        {
            return await ClearCountedInternalAsync(counted, request);
        }

        if (serialized != null)
        {
            throw new InvalidOperationException(
                $"Serialized equipment '{serialized.Name}' cannot be cleared because current status is '{serialized.Status}', not 'NeedsInspection'.");
        }

        if (counted != null)
        {
            throw new InvalidOperationException(
                $"Counted inventory '{counted.Name}' has 0 units currently in inspection.");
        }

        throw new KeyNotFoundException($"Equipment with Id {equipmentId} not found.");
    }

    private async Task<ClearInspectionResponseDto> ClearSerializedInspectionAsync(int equipmentId, ClearInspectionRequestDto request)
    {
        var item = await _db.SerializedEquipment.FirstOrDefaultAsync(e => e.Id == equipmentId)
            ?? throw new KeyNotFoundException($"SerializedEquipment with Id {equipmentId} not found.");

        if (item.Status != EquipmentStatus.NeedsInspection)
        {
            throw new InvalidOperationException(
                $"'{item.Name}' cannot be cleared from inspection because current status is '{item.Status}', not 'NeedsInspection'.");
        }

        item.Status = EquipmentStatus.Available;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Serialized equipment '{Name}' (Id {Id}) cleared from inspection. Notes: '{Notes}'.",
            item.Name, item.Id, request.ResolutionNotes);

        return item.ToClearInspectionResponseDto(request.ResolutionNotes, DateTime.UtcNow);
    }

    private async Task<ClearInspectionResponseDto> ClearCountedInspectionAsync(int poolId, ClearInspectionRequestDto request)
    {
        var pool = await _db.CountedInventory.FirstOrDefaultAsync(c => c.Id == poolId)
            ?? throw new KeyNotFoundException($"CountedInventory with Id {poolId} not found.");

        return await ClearCountedInternalAsync(pool, request);
    }

    private async Task<ClearInspectionResponseDto> ClearCountedInternalAsync(CountedInventory pool, ClearInspectionRequestDto request)
    {
        if (pool.QuantityInInspection == 0)
        {
            throw new InvalidOperationException($"'{pool.Name}' has no units currently in inspection.");
        }

        int qtyToClear = request.Quantity;
        if (qtyToClear < 1 || qtyToClear > pool.QuantityInInspection)
        {
            throw new ArgumentException(
                $"Clear quantity {qtyToClear} is invalid. Only {pool.QuantityInInspection} unit(s) currently in inspection.");
        }

        pool.QuantityInInspection -= qtyToClear;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Counted pool '{Name}' (Id {Id}): cleared {Quantity} unit(s) from inspection. Remaining: {Remaining}. Notes: '{Notes}'.",
            pool.Name, pool.Id, qtyToClear, pool.QuantityInInspection, request.ResolutionNotes);

        return pool.ToClearInspectionResponseDto(qtyToClear, request.ResolutionNotes, DateTime.UtcNow);
    }

    // -----------------------------------------------------------------------
    // Mark Asset Lost (Story 5.2 / FR-21)
    // -----------------------------------------------------------------------

    /// <summary>
    /// Transitions asset from Available, Out, or NeedsInspection to permanent Lost state,
    /// closing any active checkout line (Story 5.2 / FR-21).
    /// </summary>
    public async Task<MarkLostResponseDto> MarkAssetLostAsync(int equipmentId, MarkLostRequestDto? request)
    {
        var item = await _db.SerializedEquipment.FirstOrDefaultAsync(e => e.Id == equipmentId)
            ?? throw new KeyNotFoundException($"SerializedEquipment with Id {equipmentId} not found.");

        if (!item.IsActive)
            throw new InvalidOperationException($"Asset '{item.Name}' is deactivated.");

        if (item.Status == EquipmentStatus.Lost)
            throw new InvalidOperationException($"Asset '{item.Name}' is already marked as Lost.");

        var previousStatus = item.Status.ToString();
        item.Status = EquipmentStatus.Lost;

        // Mark Lost closes any open line (Story 5.2 rule)
        var openLine = await _db.CheckoutLines
            .FirstOrDefaultAsync(l => l.SerializedEquipmentId == equipmentId && !l.IsClosed);

        if (openLine != null)
        {
            openLine.IsClosed = true;
            openLine.ActualReturnTimestamp = DateTime.UtcNow;
            openLine.ReturnCondition = ReturnCondition.Damaged;
            openLine.ConditionNotes = string.IsNullOrWhiteSpace(request?.Notes)
                ? "Marked Lost by Admin"
                : $"Marked Lost by Admin: {request.Notes.Trim()}";
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Equipment Id={Id} ('{Name}') marked Lost from status '{PrevStatus}'. Open checkout closed: {HasClosedLine}.",
            item.Id, item.Name, previousStatus, openLine != null);

        return item.ToMarkLostResponseDto(previousStatus, openLine, DateTime.UtcNow);
    }

    // -----------------------------------------------------------------------
    // Equipment Catalog & Counted Inventory Administration (Story 5.4 / FR-11, FR-22)
    // -----------------------------------------------------------------------

    /// <summary>
    /// Creates a new serialized equipment or counted inventory record (Story 5.4).
    /// </summary>
    public async Task<EquipmentAdminResponseDto> CreateEquipmentAsync(CreateEquipmentRequestDto request)
    {
        string itemType = request.ItemType?.Trim().ToLowerInvariant() ?? "serialized";

        if (itemType == "counted")
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentException("Equipment name is required.");
            if (string.IsNullOrWhiteSpace(request.Category))
                throw new ArgumentException("Category is required.");
            if (request.TotalQuantity < 1)
                throw new ArgumentException("TotalQuantity must be at least 1.");

            var pool = new CountedInventory
            {
                Name = request.Name.Trim(),
                Category = request.Category.Trim(),
                TotalQuantity = request.TotalQuantity,
                QuantityOut = 0,
                QuantityInInspection = 0
            };

            await _db.CountedInventory.AddAsync(pool);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Counted inventory pool created: Id={Id}, Name='{Name}', TotalQty={Qty}.",
                pool.Id, pool.Name, pool.TotalQuantity);

            return pool.ToAdminResponseDto($"Counted inventory '{pool.Name}' created successfully.");
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentException("Equipment name is required.");
            if (string.IsNullOrWhiteSpace(request.Category))
                throw new ArgumentException("Category is required.");
            if (string.IsNullOrWhiteSpace(request.SerialNumber))
                throw new ArgumentException("SerialNumber is required for serialized equipment.");

            string sn = request.SerialNumber.Trim();
            bool duplicateSn = await _db.SerializedEquipment.AnyAsync(e => e.SerialNumber == sn);
            if (duplicateSn)
                throw new InvalidOperationException($"An equipment item with SerialNumber '{sn}' already exists.");

            Personnel? approver = null;
            if (request.ApproverId.HasValue && request.ApproverId.Value > 0)
            {
                approver = await _db.Personnel.FirstOrDefaultAsync(p => p.Id == request.ApproverId.Value && p.IsActive)
                    ?? throw new ArgumentException($"Approver personnel with Id {request.ApproverId.Value} not found or inactive.");
            }

            var item = new SerializedEquipment
            {
                Name = request.Name.Trim(),
                Category = request.Category.Trim(),
                SerialNumber = sn,
                Status = EquipmentStatus.Available,
                RequiresApproval = request.RequiresApproval,
                ApproverId = request.ApproverId,
                IsActive = true
            };

            await _db.SerializedEquipment.AddAsync(item);
            await _db.SaveChangesAsync();

            item.Approver = approver;

            _logger.LogInformation("Serialized equipment created: Id={Id}, Name='{Name}', S/N='{SN}', Approval={Approval}.",
                item.Id, item.Name, item.SerialNumber, item.RequiresApproval);

            return item.ToAdminResponseDto($"Serialized equipment '{item.Name}' created successfully.");
        }
    }

    /// <summary>
    /// Updates details, toggles RequiresApproval, assigns ApproverId, or adjusts counted inventory totals (Story 5.4).
    /// </summary>
    public async Task<EquipmentAdminResponseDto> UpdateEquipmentAsync(int id, UpdateEquipmentRequestDto request)
    {
        string? itemType = request.ItemType?.Trim().ToLowerInvariant();

        // Check serialized equipment
        if (itemType != "counted")
        {
            var item = await _db.SerializedEquipment
                .Include(e => e.Approver)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (item != null)
            {
                if (!string.IsNullOrWhiteSpace(request.Name))
                    item.Name = request.Name.Trim();
                if (!string.IsNullOrWhiteSpace(request.Category))
                    item.Category = request.Category.Trim();
                if (!string.IsNullOrWhiteSpace(request.SerialNumber))
                    item.SerialNumber = request.SerialNumber.Trim();

                if (request.RequiresApproval.HasValue)
                    item.RequiresApproval = request.RequiresApproval.Value;

                if (request.ApproverId.HasValue)
                {
                    if (request.ApproverId.Value > 0)
                    {
                        var approver = await _db.Personnel.FirstOrDefaultAsync(p => p.Id == request.ApproverId.Value && p.IsActive)
                            ?? throw new ArgumentException($"Approver personnel with Id {request.ApproverId.Value} not found or inactive.");
                        item.ApproverId = approver.Id;
                        item.Approver = approver;
                    }
                    else
                    {
                        item.ApproverId = null;
                        item.Approver = null;
                    }
                }

                if (request.IsActive.HasValue)
                    item.IsActive = request.IsActive.Value;

                await _db.SaveChangesAsync();

                _logger.LogInformation("Serialized equipment Id={Id} updated. RequiresApproval={Approval}, IsActive={Active}.",
                    item.Id, item.RequiresApproval, item.IsActive);

                return item.ToAdminResponseDto($"Serialized equipment '{item.Name}' updated successfully.");
            }
        }

        // Check counted inventory
        var pool = await _db.CountedInventory.FirstOrDefaultAsync(c => c.Id == id);
        if (pool != null)
        {
            if (!string.IsNullOrWhiteSpace(request.Name))
                pool.Name = request.Name.Trim();
            if (!string.IsNullOrWhiteSpace(request.Category))
                pool.Category = request.Category.Trim();

            if (request.TotalQuantity.HasValue)
            {
                int newTotal = request.TotalQuantity.Value;
                int minRequired = pool.QuantityOut + pool.QuantityInInspection;
                if (newTotal < minRequired)
                {
                    throw new InvalidOperationException(
                        $"TotalQuantity ({newTotal}) cannot be less than units currently Out ({pool.QuantityOut}) + In Inspection ({pool.QuantityInInspection}).");
                }
                pool.TotalQuantity = newTotal;
            }

            await _db.SaveChangesAsync();

            _logger.LogInformation("Counted inventory Id={Id} updated. TotalQuantity={Total}.", pool.Id, pool.TotalQuantity);

            return pool.ToAdminResponseDto($"Counted inventory '{pool.Name}' updated successfully.");
        }

        throw new KeyNotFoundException($"Equipment with Id {id} not found.");
    }

    /// <summary>
    /// Soft-deletes equipment (IsActive = false). Deactivated gear disappears from checkout rosters (Story 5.4).
    /// </summary>
    public async Task<EquipmentAdminResponseDto> DeactivateEquipmentAsync(int id)
    {
        var item = await _db.SerializedEquipment
            .Include(e => e.Approver)
            .FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException($"SerializedEquipment with Id {id} not found.");

        item.IsActive = false;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Serialized equipment Id={Id} deactivated (soft-deleted).", item.Id);

        return item.ToAdminResponseDto($"Serialized equipment '{item.Name}' deactivated successfully.");
    }
}
