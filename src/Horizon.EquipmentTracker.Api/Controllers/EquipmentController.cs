using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Services;

namespace Horizon.EquipmentTracker.Api.Controllers;

/// <summary>
/// Thin HTTP adapter for equipment availability and survey kit template queries (AD-1, AD-11).
/// Delegates all business logic to EquipmentService.
/// </summary>
[ApiController]
[Route("api/equipment")]
public class EquipmentController : ControllerBase
{
    private readonly EquipmentService _equipmentService;

    public EquipmentController(EquipmentService equipmentService)
    {
        _equipmentService = equipmentService;
    }

    /// <summary>
    /// GET /api/equipment — Returns serialized equipment status and counted inventory pool totals.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(EquipmentAvailabilityDto), 200)]
    public async Task<IActionResult> GetEquipment()
    {
        var result = await _equipmentService.GetAvailabilityAsync();
        return Ok(result);
    }
}
