using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Horizon.EquipmentTracker.Api.Data;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Mapping;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Services;

/// <summary>
/// Business logic for personnel queries and administration (AD-6, AD-11, Story 5.3).
/// Accesses DbContext directly — no repository wrapper.
/// Soft-deletes personnel (IsActive = false) to preserve historical audit trail integrity.
/// </summary>
public class PersonnelService
{
    private readonly EquipmentTrackerDbContext _db;
    private readonly ILogger<PersonnelService> _logger;

    public PersonnelService(EquipmentTrackerDbContext db, ILogger<PersonnelService> logger)
    {
        _db = db;
        _logger = logger;
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

    /// <summary>
    /// Creates a new personnel record (Story 5.3).
    /// </summary>
    public async Task<PersonnelDto> CreatePersonnelAsync(CreatePersonnelRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Personnel name is required.");
        if (string.IsNullOrWhiteSpace(request.Role))
            throw new ArgumentException("Personnel role is required.");

        var person = new Personnel
        {
            Name = request.Name.Trim(),
            Role = request.Role.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            IsActive = true
        };

        await _db.Personnel.AddAsync(person);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Personnel record created: Id={Id}, Name='{Name}', Role='{Role}'.",
            person.Id, person.Name, person.Role);

        return person.ToDto();
    }

    /// <summary>
    /// Updates an existing personnel record (Story 5.3).
    /// </summary>
    public async Task<PersonnelDto> UpdatePersonnelAsync(int id, UpdatePersonnelRequestDto request)
    {
        var person = await _db.Personnel.FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException($"Personnel with Id {id} not found.");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Personnel name is required.");
        if (string.IsNullOrWhiteSpace(request.Role))
            throw new ArgumentException("Personnel role is required.");

        person.Name = request.Name.Trim();
        person.Role = request.Role.Trim();
        person.PhoneNumber = request.PhoneNumber.Trim();

        if (request.IsActive.HasValue)
        {
            person.IsActive = request.IsActive.Value;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Personnel record updated: Id={Id}, Name='{Name}', IsActive={IsActive}.",
            person.Id, person.Name, person.IsActive);

        return person.ToDto();
    }

    /// <summary>
    /// Soft-deletes (deactivates) a personnel record to preserve audit history integrity (Story 5.3 / FR-22).
    /// </summary>
    public async Task<PersonnelDto> DeactivatePersonnelAsync(int id)
    {
        var person = await _db.Personnel.FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException($"Personnel with Id {id} not found.");

        person.IsActive = false;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Personnel record deactivated (soft-deleted): Id={Id}, Name='{Name}'.",
            person.Id, person.Name);

        return person.ToDto();
    }
}
