using System;

namespace Horizon.EquipmentTracker.Api.Models.Entities;

public class DueDateExtensionLog
{
    public int Id { get; set; }
    public int CheckoutLineId { get; set; }
    public DateOnly PreviousDate { get; set; }
    public DateOnly NewDate { get; set; }
    public int ExtendedById { get; set; }
    public DateTime Timestamp { get; set; }

    public CheckoutLine CheckoutLine { get; set; } = null!;
    public Personnel ExtendedBy { get; set; } = null!;
}
