using System;
using System.ComponentModel.DataAnnotations;

namespace Horizon.EquipmentTracker.Api.Dtos;

// ---------------------------------------------------------------------------
// Admin REQUEST DTOs
// ---------------------------------------------------------------------------

/// <summary>Request body for POST /api/admin/equipment/{id}/clear-inspection.</summary>
public class ClearInspectionRequestDto
{
    /// <summary>
    /// For counted inventory: quantity to clear from inspection pool (defaults to 1).
    /// For serialized items: ignored (always 1).
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
    public int Quantity { get; set; } = 1;

    /// <summary>Optional resolution notes (e.g. "Repaired", "Calibrated", "False alarm").</summary>
    public string? ResolutionNotes { get; set; }

    /// <summary>Optional classification hint: "serialized" or "counted".</summary>
    public string? ItemType { get; set; }
}

// ---------------------------------------------------------------------------
// Admin RESPONSE DTOs
// ---------------------------------------------------------------------------

/// <summary>Response DTO returned upon clearing equipment from inspection.</summary>
public class ClearInspectionResponseDto
{
    public int EquipmentId { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int QuantityCleared { get; set; }
    public int RemainingInInspection { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ResolutionNotes { get; set; }
    public string ClearedTimestamp { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
