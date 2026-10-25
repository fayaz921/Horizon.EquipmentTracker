using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Horizon.EquipmentTracker.Api.Common;
using Horizon.EquipmentTracker.Api.Data;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Mapping;

namespace Horizon.EquipmentTracker.Api.Services;

/// <summary>
/// Domain service encapsulating historical custody queries with interval overlap calculation (AD-2, AD-11, Story 4.4).
/// Uses EquipmentTrackerDbContext directly — no repository wrapper. Records are never deleted.
/// </summary>
public class HistoryService
{
    private readonly EquipmentTrackerDbContext _db;
    private readonly ILogger<HistoryService> _logger;

    public HistoryService(EquipmentTrackerDbContext db, ILogger<HistoryService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Queries historical checkout lines matching interval overlap with query window,
    /// person filter, and equipment filter. Open checkouts count as extending to current timestamp.
    /// </summary>
    public async Task<IReadOnlyList<HistoryLineResponseDto>> GetHistoryAsync(
        string? preset = null,
        DateOnly? from = null,
        DateOnly? to = null,
        int? personId = null,
        int? equipmentId = null)
    {
        var nowUtc = DateTime.UtcNow;
        DateTime? windowStartUtc = null;
        DateTime? windowEndUtc = null;

        var pktToday = DateTimeExtensions.GetCurrentPktDate();

        if (string.Equals(preset, "last-month", StringComparison.OrdinalIgnoreCase))
        {
            var lastMonth = pktToday.AddMonths(-1);
            var start = new DateOnly(lastMonth.Year, lastMonth.Month, 1);
            var end = new DateOnly(lastMonth.Year, lastMonth.Month, DateTime.DaysInMonth(lastMonth.Year, lastMonth.Month));
            windowStartUtc = start.PktDateStartToUtc();
            windowEndUtc = end.PktDateEndToUtc();
        }
        else if (string.Equals(preset, "this-month", StringComparison.OrdinalIgnoreCase))
        {
            var start = new DateOnly(pktToday.Year, pktToday.Month, 1);
            var end = new DateOnly(pktToday.Year, pktToday.Month, DateTime.DaysInMonth(pktToday.Year, pktToday.Month));
            windowStartUtc = start.PktDateStartToUtc();
            windowEndUtc = end.PktDateEndToUtc();
        }
        else
        {
            if (from.HasValue)
                windowStartUtc = from.Value.PktDateStartToUtc();
            if (to.HasValue)
                windowEndUtc = to.Value.PktDateEndToUtc();
        }

        var query = _db.CheckoutLines
            .Include(l => l.CheckoutEvent)
                .ThenInclude(e => e.LoggedBy)
            .Include(l => l.Recipient)
            .Include(l => l.SerializedEquipment)
            .Include(l => l.CountedInventory)
            .Include(l => l.ExtensionLogs)
            .AsNoTracking()
            .AsQueryable();

        // Filter by person
        if (personId.HasValue)
        {
            query = query.Where(l => l.RecipientId == personId.Value);
        }

        // Filter by equipment (serialized or counted)
        if (equipmentId.HasValue)
        {
            query = query.Where(l => l.SerializedEquipmentId == equipmentId.Value ||
                                     l.CountedInventoryId == equipmentId.Value);
        }

        // Interval overlap calculation: [T_checkout, T_return] overlaps [W_start, W_end]
        // Open checkout line treats T_return as nowUtc
        if (windowStartUtc.HasValue)
        {
            var wStart = windowStartUtc.Value;
            query = query.Where(l => (l.ActualReturnTimestamp ?? nowUtc) >= wStart);
        }

        if (windowEndUtc.HasValue)
        {
            var wEnd = windowEndUtc.Value;
            query = query.Where(l => l.CheckoutEvent.CheckoutTimestamp <= wEnd);
        }

        var lines = await query
            .OrderByDescending(l => l.CheckoutEvent.CheckoutTimestamp)
            .ThenByDescending(l => l.Id)
            .ToListAsync();

        _logger.LogInformation(
            "Historical custody query returned {Count} record(s). Preset='{Preset}', Window=[{Start} .. {End}], PersonId={PersonId}, EquipmentId={EquipmentId}.",
            lines.Count, preset, windowStartUtc, windowEndUtc, personId, equipmentId);

        return lines.Select(l => l.ToHistoryResponseDto()).ToList().AsReadOnly();
    }
}
