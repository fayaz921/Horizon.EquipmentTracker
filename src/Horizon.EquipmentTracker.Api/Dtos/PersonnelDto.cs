namespace Horizon.EquipmentTracker.Api.Dtos;

/// <summary>Response DTO for a single active personnel record.</summary>
public class PersonnelDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}
