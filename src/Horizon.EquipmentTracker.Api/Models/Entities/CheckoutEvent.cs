using System;
using System.Collections.Generic;

namespace Horizon.EquipmentTracker.Api.Models.Entities;

public class CheckoutEvent
{
    public int Id { get; set; }
    public int LoggedById { get; set; }
    public DateTime CheckoutTimestamp { get; set; }

    public Personnel LoggedBy { get; set; } = null!;
    public ICollection<CheckoutLine> Lines { get; set; } = new List<CheckoutLine>();
}
