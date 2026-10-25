using System.ComponentModel.DataAnnotations;
using Horizon.EquipmentTracker.Api.Models.Enums;

namespace Horizon.EquipmentTracker.Api.Dtos;

// ---------------------------------------------------------------------------
// Return REQUEST DTOs
// ---------------------------------------------------------------------------

/// <summary>Request body for POST /api/returns/{lineId}.</summary>
public class ReturnRequestDto
{
    /// <summary>
    /// Condition of the returned item (mandatory: Good or Damaged).
    /// </summary>
    [Required(ErrorMessage = "Condition is required ('Good' or 'Damaged').")]
    public ReturnCondition? Condition { get; set; }

    /// <summary>Optional notes about the item condition.</summary>
    public string? ConditionNotes { get; set; }

    /// <summary>
    /// Quantity to return. For serialized items this must be 1 (or omitted).
    /// For counted items, supports partial return (must be between 1 and the checked-out quantity).
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
    public int Quantity { get; set; } = 1;
}

// ---------------------------------------------------------------------------
// Return RESPONSE DTOs
// ---------------------------------------------------------------------------

/// <summary>Response DTO returned by POST /api/returns/{lineId}.</summary>
public class ReturnResponseDto
{
    public int LineId { get; set; }
    public bool IsClosed { get; set; }
    public string ActualReturnTimestamp { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public string? ConditionNotes { get; set; }
    public int QuantityReturned { get; set; }

    /// <summary>
    /// For counted inventory: remaining quantity still checked out (0 if fully returned).
    /// For serialized items: always 0.
    /// </summary>
    public int QuantityStillOut { get; set; }

    /// <summary>
    /// For serialized items: new status after return (Available or NeedsInspection).
    /// For counted items: null.
    /// </summary>
    public string? NewEquipmentStatus { get; set; }
}
