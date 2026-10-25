using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Services;

namespace Horizon.EquipmentTracker.Api.Controllers;

/// <summary>
/// Thin HTTP adapter for per-line returns (AD-1, AD-11).
/// Catches DbUpdateConcurrencyException and maps it to HTTP 409 (AD-3).
/// Delegates all business logic to ReturnService.
/// </summary>
[ApiController]
[Route("api/returns")]
public class ReturnsController : ControllerBase
{
    private readonly ReturnService _returnService;

    public ReturnsController(ReturnService returnService)
    {
        _returnService = returnService;
    }

    /// <summary>
    /// POST /api/returns/{lineId} — Closes an individual checkout line.
    /// Supports partial quantity returns for counted inventory (AD-7, AD-3).
    /// </summary>
    [HttpPost("{lineId:int}")]
    [ProducesResponseType(typeof(ReturnResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    public async Task<IActionResult> ReturnLine(int lineId, [FromBody] ReturnRequestDto request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var result = await _returnService.ReturnLineAsync(lineId, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 404,
                title: "Line Not Found");
        }
        catch (ArgumentException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 400,
                title: "Invalid Return Request");
        }
        catch (InvalidOperationException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 409,
                title: "Return Conflict");
        }
        catch (DbUpdateConcurrencyException)
        {
            // AD-3: Concurrent modification detected by EF Core RowVersion
            return Problem(
                detail: "This item was just updated by another request. Please refresh and try again.",
                statusCode: 409,
                title: "Concurrency Conflict");
        }
    }
}
