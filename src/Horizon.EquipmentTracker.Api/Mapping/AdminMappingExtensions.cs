using System;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Mapping;

/// <summary>
/// Hand-written static mapping extension methods for admin inspection clearance (AD-11, no AutoMapper).
/// </summary>
public static class AdminMappingExtensions
{
    public static ClearInspectionResponseDto ToClearInspectionResponseDto(
        this SerializedEquipment item,
        string? resolutionNotes,
        DateTime clearedTimestamp) => new()
    {
        EquipmentId = item.Id,
        ItemType = "Serialized",
        Name = item.Name,
        QuantityCleared = 1,
        RemainingInInspection = 0,
        Status = item.Status.ToString(),
        ResolutionNotes = resolutionNotes,
        ClearedTimestamp = clearedTimestamp.ToString("o"),
        Message = $"Serialized equipment '{item.Name}' cleared from inspection and restored to Available."
    };

    public static ClearInspectionResponseDto ToClearInspectionResponseDto(
        this CountedInventory pool,
        int quantityCleared,
        string? resolutionNotes,
        DateTime clearedTimestamp) => new()
    {
        EquipmentId = pool.Id,
        ItemType = "Counted",
        Name = pool.Name,
        QuantityCleared = quantityCleared,
        RemainingInInspection = pool.QuantityInInspection,
        Status = $"Available: {pool.AvailableQuantity}",
        ResolutionNotes = resolutionNotes,
        ClearedTimestamp = clearedTimestamp.ToString("o"),
        Message = $"Counted inventory '{pool.Name}': {quantityCleared} unit(s) cleared from inspection. Remaining in inspection: {pool.QuantityInInspection}."
    };
}
