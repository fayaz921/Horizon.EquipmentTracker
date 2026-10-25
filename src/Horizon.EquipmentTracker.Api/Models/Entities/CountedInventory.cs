using System.Collections.Generic;

namespace Horizon.EquipmentTracker.Api.Models.Entities;

public class CountedInventory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public int QuantityOut { get; set; }
    public int QuantityInInspection { get; set; }
    public byte[] RowVersion { get; set; } = [];

    public int AvailableQuantity => TotalQuantity - QuantityOut - QuantityInInspection;

    public ICollection<CheckoutLine> CheckoutLines { get; set; } = new List<CheckoutLine>();
}
