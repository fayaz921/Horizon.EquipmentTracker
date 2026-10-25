using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Horizon.EquipmentTracker.Api.Dtos;

// ---------------------------------------------------------------------------
// Checkout REQUEST DTOs
// ---------------------------------------------------------------------------

/// <summary>One line in a multi-line checkout request.</summary>
public class CheckoutLineRequestDto
{
    /// <summary>
    /// Set if checking out a serialized (individually tracked) item.
    /// Mutually exclusive with CountedInventoryId.
    /// </summary>
    public int? SerializedEquipmentId { get; set; }

    /// <summary>
    /// Set if checking out counted (bulk) inventory.
    /// Mutually exclusive with SerializedEquipmentId.
    /// </summary>
    public int? CountedInventoryId { get; set; }

    /// <summary>Quantity for counted inventory lines. Ignored for serialized items (always 1).</summary>
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
    public int Quantity { get; set; } = 1;

    /// <summary>Staff member who physically takes custody of this item.</summary>
    [Required]
    public int RecipientId { get; set; }

    /// <summary>Expected return date (ISO-8601, yyyy-MM-dd).</summary>
    [Required]
    public DateOnly ExpectedReturnDate { get; set; }
}

/// <summary>Top-level request body for POST /api/checkouts.</summary>
public class CreateCheckoutRequestDto
{
    /// <summary>Staff member who is recording/logging the checkout event.</summary>
    [Required]
    public int LoggedById { get; set; }

    /// <summary>One or more equipment lines being checked out in this event.</summary>
    [Required, MinLength(1, ErrorMessage = "At least one checkout line is required.")]
    public List<CheckoutLineRequestDto> Lines { get; set; } = [];
}

// ---------------------------------------------------------------------------
// Checkout RESPONSE DTOs
// ---------------------------------------------------------------------------

/// <summary>Response DTO for a single checkout line.</summary>
public class CheckoutLineResponseDto
{
    public int LineId { get; set; }
    public int? SerializedEquipmentId { get; set; }
    public string? SerializedEquipmentName { get; set; }
    public int? CountedInventoryId { get; set; }
    public string? CountedInventoryName { get; set; }
    public int Quantity { get; set; }
    public int RecipientId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string ExpectedReturnDate { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
}

/// <summary>Response DTO for a checkout event (POST /api/checkouts response).</summary>
public class CheckoutResponseDto
{
    public int CheckoutEventId { get; set; }
    public int LoggedById { get; set; }
    public string LoggedByName { get; set; } = string.Empty;
    public string CheckoutTimestamp { get; set; } = string.Empty;
    public IReadOnlyList<CheckoutLineResponseDto> Lines { get; set; } = [];
}

// ---------------------------------------------------------------------------
// Active Custody RESPONSE DTOs (Story 2.4)
// ---------------------------------------------------------------------------

/// <summary>Response DTO for an active (open) checkout line.</summary>
public class ActiveCustodyLineDto
{
    public int LineId { get; set; }
    public int CheckoutEventId { get; set; }
    public int RecipientId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientPhone { get; set; } = string.Empty;
    public int? SerializedEquipmentId { get; set; }
    public string? SerializedEquipmentName { get; set; }
    public string? SerialNumber { get; set; }
    public int? CountedInventoryId { get; set; }
    public string? CountedInventoryName { get; set; }
    public int Quantity { get; set; }
    public string ExpectedReturnDate { get; set; } = string.Empty;
    public bool IsOverdue { get; set; }
    public bool IsDueToday { get; set; }
    public string CheckoutTimestamp { get; set; } = string.Empty;
}
