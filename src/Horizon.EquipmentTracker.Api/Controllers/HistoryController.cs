using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Services;

namespace Horizon.EquipmentTracker.Api.Controllers;

/// <summary>
/// Thin HTTP adapter for historical custody queries (AD-1, AD-11, Story 4.4).
/// Delegates all domain logic to HistoryService.
/// </summary>
[ApiController]
[Route("api/history")]
public class HistoryController : ControllerBase
{
    private readonly HistoryService _historyService;

    public HistoryController(HistoryService historyService)
    {
        _historyService = historyService;
    }

    /// <summary>
    /// GET /api/history — Returns historical checkout custody lines with interval overlap matching.
    /// Supports presets ('this-month', 'last-month'), custom date range ('from', 'to'), and filtering by PersonId and EquipmentId.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<HistoryLineResponseDto>), 200)]
    public async Task<IActionResult> GetHistory(
        [FromQuery] string? preset,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int? personId,
        [FromQuery] int? equipmentId)
    {
        var result = await _historyService.GetHistoryAsync(preset, from, to, personId, equipmentId);
        return Ok(result);
    }
}
