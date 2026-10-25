using System;
using System.Linq;
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

    public static ActiveCustodyLineDto ToActiveCustodyDto(this CheckoutLine line)
    {
        bool isOverdue = line.ExpectedReturnDate.IsOverdue();
        bool isDueToday = line.ExpectedReturnDate.IsDueToday();
        string equipmentName = line.SerializedEquipment?.Name ?? line.CountedInventory?.Name ?? "Equipment";
        string recipientName = line.Recipient?.Name ?? "Surveyor";
        string rawPhone = line.Recipient?.PhoneNumber ?? string.Empty;
        string formattedPhone = PakistaniPhoneFormatter.FormatToInternational(rawPhone);

        return new ActiveCustodyLineDto
        {
            LineId = line.Id,
            CheckoutEventId = line.CheckoutEventId,
            RecipientId = line.RecipientId,
            RecipientName = line.Recipient?.Name ?? string.Empty,
            RecipientPhone = rawPhone,
            FormattedRecipientPhone = formattedPhone,
            SerializedEquipmentId = line.SerializedEquipmentId,
            SerializedEquipmentName = line.SerializedEquipment?.Name,
            SerialNumber = line.SerializedEquipment?.SerialNumber,
            CountedInventoryId = line.CountedInventoryId,
            CountedInventoryName = line.CountedInventory?.Name,
            Quantity = line.Quantity,
            ExpectedReturnDate = line.ExpectedReturnDate.ToString("yyyy-MM-dd"),
            IsOverdue = isOverdue,
            IsDueToday = isDueToday,
            StatusBadge = line.ExpectedReturnDate.GetDelinquencyStatus(),
            DaysDelinquent = line.ExpectedReturnDate.GetDaysDelinquent(),
            ExtensionCount = line.ExtensionLogs?.Count ?? 0,
            WhatsAppReminderUrl = PakistaniPhoneFormatter.BuildWhatsAppReminderUrl(
                rawPhone,
                recipientName,
                equipmentName,
                line.ExpectedReturnDate,
                isOverdue,
                isDueToday),
            CheckoutTimestamp = line.CheckoutEvent?.CheckoutTimestamp.ToString("o") ?? string.Empty
        };
    }

    public static DueDateExtensionResponseDto ToExtensionResponseDto(
        this DueDateExtensionLog log,
        string extendedByName,
        int totalExtensions) => new()
    {
        ExtensionLogId = log.Id,
        CheckoutLineId = log.CheckoutLineId,
        PreviousDate = log.PreviousDate.ToString("yyyy-MM-dd"),
        NewDate = log.NewDate.ToString("yyyy-MM-dd"),
        ExtendedById = log.ExtendedById,
        ExtendedByName = extendedByName,
        Timestamp = log.Timestamp.ToString("o"),
        ExtensionCount = totalExtensions,
        Message = $"Due date successfully extended to {log.NewDate:yyyy-MM-dd} by {extendedByName}."
    };
}
