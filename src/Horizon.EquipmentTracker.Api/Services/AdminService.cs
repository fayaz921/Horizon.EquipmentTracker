using System;
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
/// Domain service encapsulating privileged administrative operations including inspection clearance (AD-6, AD-7, AD-11).
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

    /// <summary>
    /// Clears serialized equipment or counted inventory from NeedsInspection back to Available pool (AD-7, FR-20).
    /// </summary>
    /// <exception cref="KeyNotFoundException">Equipment not found.</exception>
    /// <exception cref="InvalidOperationException">Item is not in inspection.</exception>
    /// <exception cref="ArgumentException">Invalid quantity.</exception>
    /// <exception cref="DbUpdateConcurrencyException">Propagated to controller for HTTP 409 mapping (AD-3).</exception>
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

        // If neither was in inspection, provide actionable error message
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
            throw new InvalidOperationException(
                $"'{pool.Name}' has no units currently in inspection.");
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
}
