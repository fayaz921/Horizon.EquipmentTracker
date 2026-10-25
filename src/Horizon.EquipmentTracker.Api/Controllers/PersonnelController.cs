using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Services;

namespace Horizon.EquipmentTracker.Api.Controllers;

/// <summary>
/// Thin HTTP adapter for personnel roster queries (AD-1, AD-11).
/// Delegates all business logic to PersonnelService.
/// </summary>
[ApiController]
[Route("api/personnel")]
public class PersonnelController : ControllerBase
{
    private readonly PersonnelService _personnelService;

    public PersonnelController(PersonnelService personnelService)
    {
        _personnelService = personnelService;
    }

    /// <summary>GET /api/personnel — Returns active personnel in alphabetical order.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PersonnelDto>), 200)]
    public async Task<IActionResult> GetPersonnel()
    {
        var result = await _personnelService.GetActivePersonnelAsync();
        return Ok(result);
    }
}
