using System.Collections.Generic;
using Horizon.EquipmentTracker.Api.Models.Enums;

namespace Horizon.EquipmentTracker.Api.Models.Entities;

public class SerializedEquipment
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SerialNumber { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public EquipmentStatus Status { get; set; } = EquipmentStatus.Available;
    public bool RequiresApproval { get; set; }
    public int? ApproverId { get; set; }
    public bool IsActive { get; set; } = true;
    public byte[] RowVersion { get; set; } = [];

    public Personnel? Approver { get; set; }
    public ICollection<CheckoutLine> CheckoutLines { get; set; } = new List<CheckoutLine>();
}
