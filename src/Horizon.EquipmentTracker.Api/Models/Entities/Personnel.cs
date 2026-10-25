using System.Collections.Generic;

namespace Horizon.EquipmentTracker.Api.Models.Entities;

public class Personnel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<CheckoutEvent> LoggedEvents { get; set; } = new List<CheckoutEvent>();
    public ICollection<CheckoutLine> CustodyLines { get; set; } = new List<CheckoutLine>();
    public ICollection<DueDateExtensionLog> AuthorizedExtensions { get; set; } = new List<DueDateExtensionLog>();
    public ICollection<SerializedEquipment> ApprovedEquipment { get; set; } = new List<SerializedEquipment>();
}
