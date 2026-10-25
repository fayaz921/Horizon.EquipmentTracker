using System.Collections.Generic;

namespace Horizon.EquipmentTracker.Api.Dtos;

/// <summary>Represents one kit item entry in the SurveyKit ItemJson.</summary>
public class KitItemDto
{
    public string Category { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;  // "serialized" | "counted"
    public int Quantity { get; set; }
}

/// <summary>Response DTO for a survey kit template (clearly labelled as sample data).</summary>
public class SurveyKitDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IReadOnlyList<KitItemDto> Items { get; set; } = [];
}
