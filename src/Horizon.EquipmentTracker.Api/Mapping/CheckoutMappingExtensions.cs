using Horizon.EquipmentTracker.Api.Common;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Mapping;

/// <summary>
/// Hand-written mapping extension methods for checkout entities ↔ DTOs (AD-11, no AutoMapper).
/// </summary>
public static class CheckoutMappingExtensions
{
    public static CheckoutLineResponseDto ToResponseDto(this CheckoutLine line) => new()
    {
        LineId = line.Id,
        SerializedEquipmentId = line.SerializedEquipmentId,
        SerializedEquipmentName = line.SerializedEquipment?.Name,
        CountedInventoryId = line.CountedInventoryId,
        CountedInventoryName = line.CountedInventory?.Name,
        Quantity = line.Quantity,
        RecipientId = line.RecipientId,
        RecipientName = line.Recipient?.Name ?? string.Empty,
        ExpectedReturnDate = line.ExpectedReturnDate.ToString("yyyy-MM-dd"),
        IsClosed = line.IsClosed,
        Status = line.SerializedEquipment != null
            ? line.SerializedEquipment.Status.ToString()
            : (line.IsClosed ? "Closed" : "Out")
    };

    public static CheckoutResponseDto ToResponseDto(this CheckoutEvent evt) => new()
    {
        CheckoutEventId = evt.Id,
        LoggedById = evt.LoggedById,
        LoggedByName = evt.LoggedBy?.Name ?? string.Empty,
        CheckoutTimestamp = evt.CheckoutTimestamp.ToString("o"),
        Lines = evt.Lines.Select(l => l.ToResponseDto()).ToList().AsReadOnly()
    };

    public static ActiveCustodyLineDto ToActiveCustodyDto(this CheckoutLine line) => new()
    {
        LineId = line.Id,
        CheckoutEventId = line.CheckoutEventId,
        RecipientId = line.RecipientId,
        RecipientName = line.Recipient?.Name ?? string.Empty,
        RecipientPhone = line.Recipient?.PhoneNumber ?? string.Empty,
        SerializedEquipmentId = line.SerializedEquipmentId,
        SerializedEquipmentName = line.SerializedEquipment?.Name,
        SerialNumber = line.SerializedEquipment?.SerialNumber,
        CountedInventoryId = line.CountedInventoryId,
        CountedInventoryName = line.CountedInventory?.Name,
        Quantity = line.Quantity,
        ExpectedReturnDate = line.ExpectedReturnDate.ToString("yyyy-MM-dd"),
        IsOverdue = line.ExpectedReturnDate.IsOverdue(),
        IsDueToday = line.ExpectedReturnDate.IsDueToday(),
        CheckoutTimestamp = line.CheckoutEvent?.CheckoutTimestamp.ToString("o") ?? string.Empty
    };
}
