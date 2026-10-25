using System;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Mapping;

/// <summary>
/// Hand-written static mapping extension methods for admin operations (AD-11, no AutoMapper).
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

    public static MarkLostResponseDto ToMarkLostResponseDto(
        this SerializedEquipment item,
        string previousStatus,
        CheckoutLine? closedLine,
        DateTime timestamp) => new()
    {
        EquipmentId = item.Id,
        ItemType = "Serialized",
        Name = item.Name,
        SerialNumber = item.SerialNumber,
        PreviousStatus = previousStatus,
        NewStatus = item.Status.ToString(),
        ClosedOpenCheckout = closedLine != null,
        ClosedLineId = closedLine?.Id,
        Timestamp = timestamp.ToString("o"),
        Message = closedLine != null
            ? $"Asset '{item.Name}' (S/N {item.SerialNumber}) marked Lost. Open checkout line {closedLine.Id} closed."
            : $"Asset '{item.Name}' (S/N {item.SerialNumber}) marked Lost."
    };

    public static EquipmentAdminResponseDto ToAdminResponseDto(
        this SerializedEquipment item,
        string message) => new()
    {
        Id = item.Id,
        ItemType = "Serialized",
        Name = item.Name,
        Category = item.Category,
        SerialNumber = item.SerialNumber,
        Status = item.Status.ToString(),
        RequiresApproval = item.RequiresApproval,
        ApproverId = item.ApproverId,
        ApproverName = item.Approver?.Name,
        TotalQuantity = 1,
        AvailableQuantity = item.Status == Models.Enums.EquipmentStatus.Available ? 1 : 0,
        IsActive = item.IsActive,
        Message = message
    };

    public static EquipmentAdminResponseDto ToAdminResponseDto(
        this CountedInventory pool,
        string message) => new()
    {
        Id = pool.Id,
        ItemType = "Counted",
        Name = pool.Name,
        Category = pool.Category,
        SerialNumber = null,
        Status = $"Available: {pool.AvailableQuantity}",
        RequiresApproval = false,
        ApproverId = null,
        ApproverName = null,
        TotalQuantity = pool.TotalQuantity,
        AvailableQuantity = pool.AvailableQuantity,
        IsActive = true,
        Message = message
    };
}
