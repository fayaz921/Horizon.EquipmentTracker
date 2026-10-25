using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Mapping;

/// <summary>
/// Hand-written mapping extension methods for Personnel ↔ DTOs (AD-11, no AutoMapper).
/// </summary>
public static class PersonnelMappingExtensions
{
    public static PersonnelDto ToDto(this Personnel p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Role = p.Role,
        PhoneNumber = p.PhoneNumber
    };
}
