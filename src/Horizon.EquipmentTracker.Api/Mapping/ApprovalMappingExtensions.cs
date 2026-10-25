using System;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Mapping;

/// <summary>
/// Hand-written static mapping extension methods for approval entities ↔ DTOs (AD-11, no AutoMapper).
/// </summary>
public static class ApprovalMappingExtensions
{
    public static PendingApprovalDto ToPendingApprovalDto(this CheckoutLine line) => new()
    {
        LineId = line.Id,
        CheckoutEventId = line.CheckoutEventId,
        SerializedEquipmentId = line.SerializedEquipmentId ?? 0,
        EquipmentName = line.SerializedEquipment?.Name ?? string.Empty,
        SerialNumber = line.SerializedEquipment?.SerialNumber ?? string.Empty,
        Category = line.SerializedEquipment?.Category ?? string.Empty,
        RecipientId = line.RecipientId,
        RecipientName = line.Recipient?.Name ?? string.Empty,
        LoggedById = line.CheckoutEvent?.LoggedById ?? 0,
        LoggedByName = line.CheckoutEvent?.LoggedBy?.Name ?? string.Empty,
        ApproverId = line.SerializedEquipment?.ApproverId,
        ApproverName = line.SerializedEquipment?.Approver?.Name ?? string.Empty,
        ExpectedReturnDate = line.ExpectedReturnDate.ToString("yyyy-MM-dd"),
        CheckoutTimestamp = line.CheckoutEvent?.CheckoutTimestamp.ToString("o") ?? string.Empty,
        Status = line.SerializedEquipment?.Status.ToString() ?? "PendingApproval"
    };

    public static ApprovalResponseDto ToApprovalResponseDto(this CheckoutLine line, DateTime approvedTimestamp) => new()
    {
        LineId = line.Id,
        SerializedEquipmentId = line.SerializedEquipmentId ?? 0,
        EquipmentName = line.SerializedEquipment?.Name ?? string.Empty,
        RecipientId = line.RecipientId,
        RecipientName = line.Recipient?.Name ?? string.Empty,
        Status = line.SerializedEquipment?.Status.ToString() ?? "Out",
        ApprovedTimestamp = approvedTimestamp.ToString("o"),
        Message = $"Request approved by designated approver. '{line.SerializedEquipment?.Name}' released to {line.Recipient?.Name}."
    };

    public static CancelApprovalResponseDto ToCancelApprovalResponseDto(this CheckoutLine line, DateTime cancelledTimestamp) => new()
    {
        LineId = line.Id,
        SerializedEquipmentId = line.SerializedEquipmentId ?? 0,
        EquipmentName = line.SerializedEquipment?.Name ?? string.Empty,
        Status = line.SerializedEquipment?.Status.ToString() ?? "Available",
        IsClosed = line.IsClosed,
        CancelledTimestamp = cancelledTimestamp.ToString("o"),
        Message = $"Pending checkout request for '{line.SerializedEquipment?.Name}' has been cancelled and returned to Available."
    };
}
