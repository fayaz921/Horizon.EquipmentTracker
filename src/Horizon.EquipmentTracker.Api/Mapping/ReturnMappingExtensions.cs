using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Models.Entities;
using Horizon.EquipmentTracker.Api.Models.Enums;

namespace Horizon.EquipmentTracker.Api.Mapping;

/// <summary>
/// Hand-written mapping extension methods for return entities ↔ DTOs (AD-11, no AutoMapper).
/// </summary>
public static class ReturnMappingExtensions
{
    public static ReturnResponseDto ToResponseDto(
        this CheckoutLine line,
        int quantityReturned,
        int quantityStillOut,
        EquipmentStatus? newSerializedStatus) => new()
    {
        LineId = line.Id,
        IsClosed = line.IsClosed,
        ActualReturnTimestamp = line.ActualReturnTimestamp?.ToString("o") ?? string.Empty,
        Condition = line.ReturnCondition?.ToString() ?? string.Empty,
        ConditionNotes = line.ConditionNotes,
        QuantityReturned = quantityReturned,
        QuantityStillOut = quantityStillOut,
        NewEquipmentStatus = newSerializedStatus?.ToString()
    };
}
