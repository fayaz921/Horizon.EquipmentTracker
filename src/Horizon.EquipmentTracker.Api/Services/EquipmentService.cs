using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Horizon.EquipmentTracker.Api.Data;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Mapping;

namespace Horizon.EquipmentTracker.Api.Services;

/// <summary>
/// Business logic for equipment availability queries and kit template retrieval.
/// Accesses DbContext directly (AD-11, no repository wrapper).
/// </summary>
public class EquipmentService
{
    private readonly EquipmentTrackerDbContext _db;

    public EquipmentService(EquipmentTrackerDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns all active serialized equipment and all counted inventory pools
    /// with current availability information.
    /// </summary>
    public async Task<EquipmentAvailabilityDto> GetAvailabilityAsync()
    {
        var serialized = await _db.SerializedEquipment
            .Where(e => e.IsActive)
            .OrderBy(e => e.Category)
            .ThenBy(e => e.Name)
            .ToListAsync();

        var counted = await _db.CountedInventory
            .OrderBy(c => c.Category)
            .ThenBy(c => c.Name)
            .ToListAsync();

        return new EquipmentAvailabilityDto
        {
            Serialized = serialized.Select(e => e.ToDto()).ToList().AsReadOnly(),
            Counted = counted.Select(c => c.ToDto()).ToList().AsReadOnly()
        };
    }

    /// <summary>
    /// Returns all survey kit templates (labelled as sample data per AD-10 / PRD §7).
    /// </summary>
    public async Task<IReadOnlyList<SurveyKitDto>> GetSurveyKitsAsync()
    {
        var kits = await _db.SurveyKits
            .OrderBy(k => k.Name)
            .ToListAsync();

        return kits.Select(k => k.ToDto()).ToList().AsReadOnly();
    }
}
