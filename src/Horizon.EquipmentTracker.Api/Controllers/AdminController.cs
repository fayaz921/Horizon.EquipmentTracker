using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Horizon.EquipmentTracker.Api.Common;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Services;

namespace Horizon.EquipmentTracker.Api.Controllers;

/// <summary>
/// Thin HTTP adapter for privileged administrative operations (AD-1, AD-6, AD-11).
/// All endpoints are secured by AdminAuthorizationFilter requiring the X-Admin-PIN header.
/// Delegates all domain logic to AdminService.
/// </summary>
[ApiController]
[Route("api/admin")]
[AdminAuthorize]
public class AdminController : ControllerBase
{
    private readonly AdminService _adminService;

    public AdminController(AdminService adminService)
    {
        _adminService = adminService;
    }

    /// <summary>
    /// POST /api/admin/equipment/{id}/clear-inspection — Clears equipment from inspection back to Available.
    /// Secured by X-Admin-PIN header.
    /// </summary>
    [HttpPost("equipment/{id:int}/clear-inspection")]
    [ProducesResponseType(typeof(ClearInspectionResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    public async Task<IActionResult> ClearInspection(int id, [FromBody] ClearInspectionRequestDto? request)
    {
        request ??= new ClearInspectionRequestDto();

        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var result = await _adminService.ClearInspectionAsync(id, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 404,
                title: "Equipment Not Found");
        }
        catch (ArgumentException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 400,
                title: "Invalid Clearance Request");
        }
        catch (InvalidOperationException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 409,
                title: "Clearance Conflict");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(
                detail: "This item was just updated by another request. Please refresh and try again.",
                statusCode: 409,
                title: "Concurrency Conflict");
        }
    }
}
