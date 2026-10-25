using System;
using System.Collections.Generic;
using Horizon.EquipmentTracker.Api.Models.Enums;

namespace Horizon.EquipmentTracker.Api.Models.Entities;

public class CheckoutLine
{
    public int Id { get; set; }
    public int CheckoutEventId { get; set; }
    public int RecipientId { get; set; }
    public int? SerializedEquipmentId { get; set; }
    public int? CountedInventoryId { get; set; }
    public int Quantity { get; set; } = 1;
    public DateOnly ExpectedReturnDate { get; set; }
    public DateTime? ActualReturnTimestamp { get; set; }
    public ReturnCondition? ReturnCondition { get; set; }
    public string? ConditionNotes { get; set; }
    public bool IsClosed { get; set; }
    public byte[] RowVersion { get; set; } = [];

    public CheckoutEvent CheckoutEvent { get; set; } = null!;
    public Personnel Recipient { get; set; } = null!;
    public SerializedEquipment? SerializedEquipment { get; set; }
    public CountedInventory? CountedInventory { get; set; }
    public ICollection<DueDateExtensionLog> ExtensionLogs { get; set; } = new List<DueDateExtensionLog>();
}
