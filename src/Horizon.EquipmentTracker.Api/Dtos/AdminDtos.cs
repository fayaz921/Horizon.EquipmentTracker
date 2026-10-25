using System;
using System.ComponentModel.DataAnnotations;

namespace Horizon.EquipmentTracker.Api.Dtos;

// ---------------------------------------------------------------------------
// Admin Inspection REQUEST & RESPONSE DTOs (Story 5.1 / AD-7)
// ---------------------------------------------------------------------------

/// <summary>Request body for POST /api/admin/equipment/{id}/clear-inspection.</summary>
public class ClearInspectionRequestDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
    public int Quantity { get; set; } = 1;

    public string? ResolutionNotes { get; set; }

    public string? ItemType { get; set; }
}

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

// ---------------------------------------------------------------------------
// Admin Mark Lost REQUEST & RESPONSE DTOs (Story 5.2 / FR-21)
// ---------------------------------------------------------------------------

/// <summary>Request body for POST /api/admin/equipment/{id}/mark-lost.</summary>
public class MarkLostRequestDto
{
    public string? Notes { get; set; }
    public string? ItemType { get; set; }
}

/// <summary>Response DTO returned upon marking equipment as Lost.</summary>
public class MarkLostResponseDto
{
    public int EquipmentId { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string PreviousStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public bool ClosedOpenCheckout { get; set; }
    public int? ClosedLineId { get; set; }
    public string Timestamp { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

// ---------------------------------------------------------------------------
// Admin Personnel REQUEST DTOs (Story 5.3 / FR-22)
// ---------------------------------------------------------------------------

/// <summary>Request body for POST /api/admin/personnel.</summary>
public class CreatePersonnelRequestDto
{
    [Required, StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 1)]
    public string Role { get; set; } = string.Empty;

    [Required, StringLength(30, MinimumLength = 5)]
    public string PhoneNumber { get; set; } = string.Empty;
}

/// <summary>Request body for PUT /api/admin/personnel/{id}.</summary>
public class UpdatePersonnelRequestDto
{
    [Required, StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 1)]
    public string Role { get; set; } = string.Empty;

    [Required, StringLength(30, MinimumLength = 5)]
    public string PhoneNumber { get; set; } = string.Empty;

    public bool? IsActive { get; set; }
}

// ---------------------------------------------------------------------------
// Admin Equipment REQUEST & RESPONSE DTOs (Story 5.4 / FR-11, FR-22)
// ---------------------------------------------------------------------------

/// <summary>Request body for POST /api/admin/equipment.</summary>
public class CreateEquipmentRequestDto
{
    /// <summary>"serialized" (default) or "counted".</summary>
    public string ItemType { get; set; } = "serialized";

    [Required, StringLength(150, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 1)]
    public string Category { get; set; } = string.Empty;

    /// <summary>Required for serialized equipment.</summary>
    public string? SerialNumber { get; set; }

    /// <summary>For serialized equipment: toggle whether checkout requires licensed operator approval.</summary>
    public bool RequiresApproval { get; set; }

    /// <summary>For serialized equipment: designated approver personnel ID (e.g. Hamza).</summary>
    public int? ApproverId { get; set; }

    /// <summary>For counted inventory: initial total quantity.</summary>
    [Range(1, int.MaxValue, ErrorMessage = "TotalQuantity must be at least 1.")]
    public int TotalQuantity { get; set; } = 1;
}

/// <summary>Request body for PUT /api/admin/equipment/{id}.</summary>
public class UpdateEquipmentRequestDto
{
    /// <summary>Optional classification hint: "serialized" or "counted".</summary>
    public string? ItemType { get; set; }

    public string? Name { get; set; }
    public string? Category { get; set; }
    public string? SerialNumber { get; set; }
    public bool? RequiresApproval { get; set; }
    public int? ApproverId { get; set; }
    public int? TotalQuantity { get; set; }
    public bool? IsActive { get; set; }
}

/// <summary>Response DTO returned for equipment administration operations.</summary>
public class EquipmentAdminResponseDto
{
    public int Id { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool RequiresApproval { get; set; }
    public int? ApproverId { get; set; }
    public string? ApproverName { get; set; }
    public int? TotalQuantity { get; set; }
    public int? AvailableQuantity { get; set; }
    public bool IsActive { get; set; }
    public string Message { get; set; } = string.Empty;
}
