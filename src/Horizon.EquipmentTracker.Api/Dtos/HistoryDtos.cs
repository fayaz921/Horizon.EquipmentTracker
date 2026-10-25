namespace Horizon.EquipmentTracker.Api.Dtos;

/// <summary>
/// Response DTO for a historical checkout line (Story 4.4 / FR-17, FR-18).
/// </summary>
public class HistoryLineResponseDto
{
    public int LineId { get; set; }
    public int CheckoutEventId { get; set; }
    public string CheckoutTimestamp { get; set; } = string.Empty;
    public string? ActualReturnTimestamp { get; set; }
    public string ExpectedReturnDate { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
    public string? ReturnCondition { get; set; }
    public string? ConditionNotes { get; set; }
    public int RecipientId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public int LoggedById { get; set; }
    public string LoggedByName { get; set; } = string.Empty;
    public int? SerializedEquipmentId { get; set; }
    public string? SerializedEquipmentName { get; set; }
    public string? SerialNumber { get; set; }
    public int? CountedInventoryId { get; set; }
    public string? CountedInventoryName { get; set; }
    public int Quantity { get; set; }
    public int ExtensionCount { get; set; }
}
