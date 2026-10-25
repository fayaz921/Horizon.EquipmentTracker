namespace Horizon.EquipmentTracker.Api.Dtos;

/// <summary>Response DTO for a serialized (individually tracked) equipment item.</summary>
public class SerializedEquipmentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SerialNumber { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool RequiresApproval { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>Response DTO for a counted (bulk) inventory pool.</summary>
public class CountedInventoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public int QuantityOut { get; set; }
    public int QuantityInInspection { get; set; }
    public int AvailableQuantity { get; set; }
}

/// <summary>Combined equipment availability response returned by GET /api/equipment.</summary>
public class EquipmentAvailabilityDto
{
    public IReadOnlyList<SerializedEquipmentDto> Serialized { get; set; } = [];
    public IReadOnlyList<CountedInventoryDto> Counted { get; set; } = [];
}
