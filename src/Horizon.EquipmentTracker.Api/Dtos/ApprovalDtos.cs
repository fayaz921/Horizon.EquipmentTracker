using System;
using System.ComponentModel.DataAnnotations;

namespace Horizon.EquipmentTracker.Api.Dtos;

// ---------------------------------------------------------------------------
// Approval REQUEST DTOs
// ---------------------------------------------------------------------------

/// <summary>Request body for POST /api/approvals/{lineId}/approve.</summary>
public class ApproveRequestDto
{
    [Required(ErrorMessage = "Approver PIN is required.")]
    public string ApproverPin { get; set; } = string.Empty;
}

// ---------------------------------------------------------------------------
// Approval RESPONSE DTOs
// ---------------------------------------------------------------------------

/// <summary>Response DTO representing a checkout line pending approver action.</summary>
public class PendingApprovalDto
{
    public int LineId { get; set; }
    public int CheckoutEventId { get; set; }
    public int SerializedEquipmentId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public string SerialNumber { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int RecipientId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public int LoggedById { get; set; }
    public string LoggedByName { get; set; } = string.Empty;
    public int? ApproverId { get; set; }
    public string ApproverName { get; set; } = string.Empty;
    public string ExpectedReturnDate { get; set; } = string.Empty;
    public string CheckoutTimestamp { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

/// <summary>Response DTO returned upon successful approver release of a restricted item.</summary>
public class ApprovalResponseDto
{
    public int LineId { get; set; }
    public int SerializedEquipmentId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public int RecipientId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ApprovedTimestamp { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

/// <summary>Response DTO returned upon cancellation of a pending approval request.</summary>
public class CancelApprovalResponseDto
{
    public int LineId { get; set; }
    public int SerializedEquipmentId { get; set; }
    public string EquipmentName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
    public string CancelledTimestamp { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
