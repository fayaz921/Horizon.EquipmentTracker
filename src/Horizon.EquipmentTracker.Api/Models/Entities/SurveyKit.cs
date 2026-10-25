namespace Horizon.EquipmentTracker.Api.Models.Entities;

public class SurveyKit
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ItemJson { get; set; } = string.Empty;
}
