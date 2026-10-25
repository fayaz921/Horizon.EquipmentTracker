using System.Text.Json;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Mapping;

/// <summary>
/// Hand-written mapping extension methods for equipment entities ↔ DTOs (AD-11, no AutoMapper).
/// </summary>
public static class EquipmentMappingExtensions
{
    public static SerializedEquipmentDto ToDto(this SerializedEquipment e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        SerialNumber = e.SerialNumber,
        Category = e.Category,
        Status = e.Status.ToString(),
        RequiresApproval = e.RequiresApproval,
        IsActive = e.IsActive
    };

    public static CountedInventoryDto ToDto(this CountedInventory c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Category = c.Category,
        TotalQuantity = c.TotalQuantity,
        QuantityOut = c.QuantityOut,
        QuantityInInspection = c.QuantityInInspection,
        AvailableQuantity = c.AvailableQuantity
    };

    public static SurveyKitDto ToDto(this SurveyKit kit)
    {
        var items = JsonSerializer.Deserialize<List<KitItemDto>>(
            kit.ItemJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

        return new SurveyKitDto
        {
            Id = kit.Id,
            Name = kit.Name,
            Description = kit.Description,
            Items = items.AsReadOnly()
        };
    }
}
