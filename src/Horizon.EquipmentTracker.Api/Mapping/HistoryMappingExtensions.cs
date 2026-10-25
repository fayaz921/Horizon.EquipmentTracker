using System.Linq;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Mapping;

/// <summary>
/// Hand-written static mapping extension methods for custody history (AD-11, no AutoMapper).
/// </summary>
public static class HistoryMappingExtensions
{
    public static HistoryLineResponseDto ToHistoryResponseDto(this CheckoutLine line) => new()
    {
        LineId = line.Id,
        CheckoutEventId = line.CheckoutEventId,
        CheckoutTimestamp = line.CheckoutEvent?.CheckoutTimestamp.ToString("o") ?? string.Empty,
        ActualReturnTimestamp = line.ActualReturnTimestamp?.ToString("o"),
        ExpectedReturnDate = line.ExpectedReturnDate.ToString("yyyy-MM-dd"),
        IsClosed = line.IsClosed,
        ReturnCondition = line.ReturnCondition?.ToString(),
        ConditionNotes = line.ConditionNotes,
        RecipientId = line.RecipientId,
        RecipientName = line.Recipient?.Name ?? string.Empty,
        LoggedById = line.CheckoutEvent?.LoggedById ?? 0,
        LoggedByName = line.CheckoutEvent?.LoggedBy?.Name ?? string.Empty,
        SerializedEquipmentId = line.SerializedEquipmentId,
        SerializedEquipmentName = line.SerializedEquipment?.Name,
        SerialNumber = line.SerializedEquipment?.SerialNumber,
        CountedInventoryId = line.CountedInventoryId,
        CountedInventoryName = line.CountedInventory?.Name,
        Quantity = line.Quantity,
        ExtensionCount = line.ExtensionLogs?.Count ?? 0
    };
}
