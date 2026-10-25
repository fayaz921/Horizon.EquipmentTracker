using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Services;

namespace Horizon.EquipmentTracker.Api.Controllers;

/// <summary>
/// Thin HTTP adapter for survey kit template queries (AD-1, AD-11).
/// Delegates all business logic to EquipmentService.
/// </summary>
[ApiController]
[Route("api/kits")]
public class KitsController : ControllerBase
{
    private readonly EquipmentService _equipmentService;

    public KitsController(EquipmentService equipmentService)
    {
        _equipmentService = equipmentService;
    }

    /// <summary>
    /// GET /api/kits — Returns sample survey kit templates (labelled as sample data).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<SurveyKitDto>), 200)]
    public async Task<IActionResult> GetKits()
    {
        var result = await _equipmentService.GetSurveyKitsAsync();
        return Ok(result);
    }
}
