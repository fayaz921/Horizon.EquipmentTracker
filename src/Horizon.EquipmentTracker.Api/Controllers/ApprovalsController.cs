using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Services;

namespace Horizon.EquipmentTracker.Api.Controllers;

/// <summary>
/// Thin HTTP adapter for the pending approvals queue and approver PIN authorization (AD-1, AD-5, AD-11).
/// Delegates all domain logic to ApprovalService.
/// </summary>
[ApiController]
[Route("api/approvals")]
public class ApprovalsController : ControllerBase
{
    private readonly ApprovalService _approvalService;

    public ApprovalsController(ApprovalService approvalService)
    {
        _approvalService = approvalService;
    }

    /// <summary>
    /// GET /api/approvals/pending — Returns all restricted assets pending approver verification.
    /// </summary>
    [HttpGet("pending")]
    [ProducesResponseType(typeof(IReadOnlyList<PendingApprovalDto>), 200)]
    public async Task<IActionResult> GetPendingApprovals()
    {
        var result = await _approvalService.GetPendingApprovalsAsync();
        return Ok(result);
    }

    /// <summary>
    /// POST /api/approvals/{lineId}/approve — Verifies approver PIN and releases restricted asset to Out.
    /// Strictly rejects invalid PINs or Admin PIN overrides with HTTP 401 ProblemDetails.
    /// </summary>
    [HttpPost("{lineId:int}/approve")]
    [ProducesResponseType(typeof(ApprovalResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    public async Task<IActionResult> Approve(int lineId, [FromBody] ApproveRequestDto request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var result = await _approvalService.ApproveRequestAsync(lineId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 401,
                title: "Unauthorized Approver");
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 404,
                title: "Line Not Found");
        }
        catch (InvalidOperationException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 409,
                title: "Approval Conflict");
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
    /// POST /api/approvals/{lineId}/cancel — Cancels a pending request and restores asset to Available.
    /// </summary>
    [HttpPost("{lineId:int}/cancel")]
    [ProducesResponseType(typeof(CancelApprovalResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    public async Task<IActionResult> Cancel(int lineId)
    {
        try
        {
            var result = await _approvalService.CancelRequestAsync(lineId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 404,
                title: "Line Not Found");
        }
        catch (InvalidOperationException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 409,
                title: "Cancellation Conflict");
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
