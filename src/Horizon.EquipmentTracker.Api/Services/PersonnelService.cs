using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Horizon.EquipmentTracker.Api.Data;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Mapping;

namespace Horizon.EquipmentTracker.Api.Services;

/// <summary>
/// Business logic for personnel queries. Accesses DbContext directly (AD-11, no repository wrapper).
/// </summary>
public class PersonnelService
{
    private readonly EquipmentTrackerDbContext _db;

    public PersonnelService(EquipmentTrackerDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns all active personnel ordered alphabetically by name.
    /// </summary>
    public async Task<IReadOnlyList<PersonnelDto>> GetActivePersonnelAsync()
    {
        var personnel = await _db.Personnel
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return personnel.Select(p => p.ToDto()).ToList().AsReadOnly();
    }
}
