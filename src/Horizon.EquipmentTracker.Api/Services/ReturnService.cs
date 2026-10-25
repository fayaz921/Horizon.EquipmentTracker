using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Horizon.EquipmentTracker.Api.Data;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Mapping;
using Horizon.EquipmentTracker.Api.Models.Enums;

namespace Horizon.EquipmentTracker.Api.Services;

/// <summary>
/// Domain service encapsulating per-line return business rules, condition recording,
/// instant damage quarantine, and partial quantity returns (AD-3, AD-7, AD-11).
/// Uses EquipmentTrackerDbContext directly — no repository wrapper.
/// </summary>
public class ReturnService
{
    private readonly EquipmentTrackerDbContext _db;
    private readonly ILogger<ReturnService> _logger;

    public ReturnService(EquipmentTrackerDbContext db, ILogger<ReturnService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Closes a checkout line (or partially returns counted inventory):
    /// <list type="bullet">
    ///   <item>Records ActualReturnTimestamp and ReturnCondition.</item>
    ///   <item>Serialized items: sets IsClosed = true, restores to Available or NeedsInspection (AD-7).</item>
    ///   <item>Counted items: decrements QuantityOut by the returned quantity;
    ///         if Damaged, increments QuantityInInspection;
    ///         IsClosed only when all quantity returned (AD-3, AD-7).</item>
    /// </list>
    /// </summary>
    /// <exception cref="ArgumentException">Thrown for invalid request data (→ HTTP 400).</exception>
    /// <exception cref="InvalidOperationException">Thrown for business rule violations (→ HTTP 409).</exception>
    /// <exception cref="KeyNotFoundException">Thrown when the line is not found (→ HTTP 404).</exception>
    /// <exception cref="DbUpdateConcurrencyException">Propagated to controller for HTTP 409 mapping (AD-3).</exception>
    public async Task<ReturnResponseDto> ReturnLineAsync(int lineId, ReturnRequestDto request)
    {
        if (!request.Condition.HasValue || !Enum.IsDefined(typeof(ReturnCondition), request.Condition.Value))
            throw new ArgumentException("Condition is required and must be Good (1) or Damaged (2).");

        var condition = request.Condition.Value;

        // Load the line with equipment navigations (locked for EF concurrency tracking)
        var line = await _db.CheckoutLines
            .Include(l => l.SerializedEquipment)
            .Include(l => l.CountedInventory)
            .FirstOrDefaultAsync(l => l.Id == lineId)
            ?? throw new KeyNotFoundException($"CheckoutLine with Id {lineId} not found.");

        if (line.IsClosed)
            throw new InvalidOperationException(
                $"CheckoutLine {lineId} is already fully closed and cannot be returned again.");

        int quantityReturned;
        int quantityStillOut = 0;
        EquipmentStatus? newSerializedStatus = null;

        if (line.SerializedEquipmentId.HasValue)
        {
            // --- Serialized item return ---
            if (request.Quantity != 1)
                throw new ArgumentException("Quantity must be 1 when returning a serialized (individually tracked) item.");

            quantityReturned = 1;
            line.IsClosed = true;
            line.ActualReturnTimestamp = DateTime.UtcNow;
            line.ReturnCondition = condition;
            line.ConditionNotes = request.ConditionNotes;

            var equipment = line.SerializedEquipment!;

            if (condition == ReturnCondition.Good)
            {
                equipment.Status = EquipmentStatus.Available;
                newSerializedStatus = EquipmentStatus.Available;
            }
            else // Damaged → instant quarantine (AD-7)
            {
                equipment.Status = EquipmentStatus.NeedsInspection;
                newSerializedStatus = EquipmentStatus.NeedsInspection;
            }

            _logger.LogInformation(
                "Serialized item '{Name}' (Line {LineId}) returned as {Condition}. New status: {Status}.",
                equipment.Name, lineId, condition, equipment.Status);
        }
        else if (line.CountedInventoryId.HasValue)
        {
            // --- Counted inventory partial return ---
            int maxReturnable = line.Quantity; // remaining quantity still out on this line
            if (request.Quantity < 1 || request.Quantity > maxReturnable)
                throw new ArgumentException(
                    $"Return quantity {request.Quantity} is out of range. " +
                    $"This line has {maxReturnable} unit(s) still checked out.");

            quantityReturned = request.Quantity;
            quantityStillOut = maxReturnable - quantityReturned;

            var pool = line.CountedInventory!;
            pool.QuantityOut -= quantityReturned;

            if (condition == ReturnCondition.Damaged)
            {
                // Damaged counted items go into inspection pool (AD-7)
                pool.QuantityInInspection += quantityReturned;
            }

            // Update line quantity to remaining; close if fully returned
            line.Quantity = quantityStillOut;
            line.ActualReturnTimestamp = DateTime.UtcNow;
            line.ReturnCondition = condition;
            line.ConditionNotes = request.ConditionNotes;

            if (quantityStillOut == 0)
            {
                line.IsClosed = true;
            }

            _logger.LogInformation(
                "Counted item '{Name}' (Line {LineId}): returned {Returned}, still out {StillOut}. Condition: {Condition}.",
                pool.Name, lineId, quantityReturned, quantityStillOut, condition);
        }
        else
        {
            throw new InvalidOperationException(
                $"CheckoutLine {lineId} has neither a serialized equipment nor counted inventory reference. Data integrity issue.");
        }

        // DbUpdateConcurrencyException propagates to controller (AD-3)
        await _db.SaveChangesAsync();

        return line.ToResponseDto(quantityReturned, quantityStillOut, newSerializedStatus);
    }
}
