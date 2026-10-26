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
/// Thin HTTP adapter for privileged administrative operations (AD-1, AD-6, AD-11, Stories 5.1-5.4).
/// All endpoints are secured by AdminAuthorizationFilter requiring the X-Admin-PIN header.
/// Delegates all domain logic to AdminService and PersonnelService.
/// </summary>
[ApiController]
[Route("api/admin")]
[AdminAuthorize]
public class AdminController : ControllerBase
{
    private readonly AdminService _adminService;
    private readonly PersonnelService _personnelService;

    public AdminController(AdminService adminService, PersonnelService personnelService)
    {
        _adminService = adminService;
        _personnelService = personnelService;
    }

    // -----------------------------------------------------------------------
    // Inspection Clearance (Story 5.1 / AD-7)
    // -----------------------------------------------------------------------

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
            return Problem(detail: ex.Message, statusCode: 404, title: "Equipment Not Found");
        }
        catch (ArgumentException ex)
        {
            return Problem(detail: ex.Message, statusCode: 400, title: "Invalid Clearance Request");
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: 409, title: "Clearance Conflict");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(
                detail: "This item was just updated by another request. Please refresh and try again.",
                statusCode: 409,
                title: "Concurrency Conflict");
        }
    }

    // -----------------------------------------------------------------------
    // Mark Asset Lost (Story 5.2 / FR-21)
    // -----------------------------------------------------------------------

    /// <summary>
    /// POST /api/admin/equipment/{id}/mark-lost — Transitions equipment to permanent Lost state and closes any open checkout line.
    /// Secured by X-Admin-PIN header.
    /// </summary>
    [HttpPost("equipment/{id:int}/mark-lost")]
    [ProducesResponseType(typeof(MarkLostResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    public async Task<IActionResult> MarkAssetLost(int id, [FromBody] MarkLostRequestDto? request)
    {
        try
        {
            var result = await _adminService.MarkAssetLostAsync(id, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(detail: ex.Message, statusCode: 404, title: "Equipment Not Found");
        }
        catch (ArgumentException ex)
        {
            return Problem(detail: ex.Message, statusCode: 400, title: "Invalid Mark Lost Request");
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: 409, title: "Mark Lost Conflict");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(
                detail: "This item was just updated by another request. Please refresh and try again.",
                statusCode: 409,
                title: "Concurrency Conflict");
        }
    }

    // -----------------------------------------------------------------------
    // Personnel Catalog Administration (Story 5.3 / FR-22)
    // -----------------------------------------------------------------------

    /// <summary>
    /// POST /api/admin/personnel — Creates a new active personnel member.
    /// Secured by X-Admin-PIN header.
    /// </summary>
    [HttpPost("personnel")]
    [ProducesResponseType(typeof(PersonnelDto), 201)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public async Task<IActionResult> CreatePersonnel([FromBody] CreatePersonnelRequestDto request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var result = await _personnelService.CreatePersonnelAsync(request);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (ArgumentException ex)
        {
            return Problem(detail: ex.Message, statusCode: 400, title: "Invalid Personnel Data");
        }
    }

    /// <summary>
    /// PUT /api/admin/personnel/{id} — Updates an existing personnel member's details.
    /// Secured by X-Admin-PIN header.
    /// </summary>
    [HttpPut("personnel/{id:int}")]
    [ProducesResponseType(typeof(PersonnelDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public async Task<IActionResult> UpdatePersonnel(int id, [FromBody] UpdatePersonnelRequestDto request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var result = await _personnelService.UpdatePersonnelAsync(id, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(detail: ex.Message, statusCode: 404, title: "Personnel Not Found");
        }
        catch (ArgumentException ex)
        {
            return Problem(detail: ex.Message, statusCode: 400, title: "Invalid Personnel Update");
        }
    }

    /// <summary>
    /// DELETE /api/admin/personnel/{id} — Soft-deletes (deactivates) a personnel member (IsActive = false).
    /// Historical custody records are preserved intact (FR-22).
    /// Secured by X-Admin-PIN header.
    /// </summary>
    [HttpDelete("personnel/{id:int}")]
    [ProducesResponseType(typeof(PersonnelDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public async Task<IActionResult> DeactivatePersonnel(int id)
    {
        try
        {
            var result = await _personnelService.DeactivatePersonnelAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(detail: ex.Message, statusCode: 404, title: "Personnel Not Found");
        }
    }

    // -----------------------------------------------------------------------
    // Equipment Catalog & Counted Inventory Administration (Story 5.4 / FR-11, FR-22)
    // -----------------------------------------------------------------------

    /// <summary>
    /// POST /api/admin/equipment — Creates new serialized equipment or counted inventory pool.
    /// Secured by X-Admin-PIN header.
    /// </summary>
    [HttpPost("equipment")]
    [ProducesResponseType(typeof(EquipmentAdminResponseDto), 201)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    public async Task<IActionResult> CreateEquipment([FromBody] CreateEquipmentRequestDto request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var result = await _adminService.CreateEquipmentAsync(request);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (ArgumentException ex)
        {
            return Problem(detail: ex.Message, statusCode: 400, title: "Invalid Equipment Data");
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: 409, title: "Equipment Conflict");
        }
    }

    /// <summary>
    /// PUT /api/admin/equipment/{id} — Updates equipment details, toggles RequiresApproval, assigns ApproverId, or adjusts inventory totals.
    /// Secured by X-Admin-PIN header.
    /// </summary>
    [HttpPut("equipment/{id:int}")]
    [ProducesResponseType(typeof(EquipmentAdminResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    public async Task<IActionResult> UpdateEquipment(int id, [FromBody] UpdateEquipmentRequestDto request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var result = await _adminService.UpdateEquipmentAsync(id, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(detail: ex.Message, statusCode: 404, title: "Equipment Not Found");
        }
        catch (ArgumentException ex)
        {
            return Problem(detail: ex.Message, statusCode: 400, title: "Invalid Equipment Update");
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: 409, title: "Equipment Conflict");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(
                detail: "This item was just updated by another request. Please refresh and try again.",
                statusCode: 409,
                title: "Concurrency Conflict");
        }
    }

    /// <summary>
    /// DELETE /api/admin/equipment/{id} — Soft-deletes (deactivates) equipment (IsActive = false).
    /// Deactivated equipment disappears from checkout rosters.
    /// Secured by X-Admin-PIN header.
    /// </summary>
    [HttpDelete("equipment/{id:int}")]
    [ProducesResponseType(typeof(EquipmentAdminResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public async Task<IActionResult> DeactivateEquipment(int id)
    {
        try
        {
            var result = await _adminService.DeactivateEquipmentAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(detail: ex.Message, statusCode: 404, title: "Equipment Not Found");
        }
    }

    // -----------------------------------------------------------------------
    // Admin PIN Verification
    // -----------------------------------------------------------------------

    /// <summary>
    /// POST /api/admin/verify-pin — Verifies the X-Admin-PIN header.
    /// Secured by X-Admin-PIN header via AdminAuthorize attribute.
    /// </summary>
    [HttpPost("verify-pin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public IActionResult VerifyPin()
    {
        return NoContent();
    }
}

