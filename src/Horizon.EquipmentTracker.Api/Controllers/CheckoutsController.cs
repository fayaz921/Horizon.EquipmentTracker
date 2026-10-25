using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Services;

namespace Horizon.EquipmentTracker.Api.Controllers;

/// <summary>
/// Thin HTTP adapter for checkout creation and active custody queries (AD-1, AD-11).
/// Catches DbUpdateConcurrencyException and maps it to HTTP 409 (AD-3).
/// Delegates all business logic to CheckoutService.
/// </summary>
[ApiController]
[Route("api/checkouts")]
public class CheckoutsController : ControllerBase
{
    private readonly CheckoutService _checkoutService;

    public CheckoutsController(CheckoutService checkoutService)
    {
        _checkoutService = checkoutService;
    }

    /// <summary>
    /// POST /api/checkouts — Creates a multi-line checkout event with dual attribution.
    /// Returns HTTP 409 on concurrency conflict (AD-3) or unavailable item conflict.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CheckoutResponseDto), 201)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    public async Task<IActionResult> CreateCheckout([FromBody] CreateCheckoutRequestDto request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var result = await _checkoutService.CreateCheckoutAsync(request);
            return CreatedAtAction(nameof(GetActiveCheckouts), null, result);
        }
        catch (ArgumentException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: 400,
                title: "Invalid Checkout Request");
        }
        catch (InvalidOperationException ex)
        {
            // Item is unavailable for checkout (status lockout or insufficient count)
            return Problem(
                detail: ex.Message,
                statusCode: 409,
                title: "Checkout Conflict");
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

    /// <summary>
    /// GET /api/checkouts/active — Returns all open checkout lines with recipient and equipment details.
    /// </summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(IReadOnlyList<ActiveCustodyLineDto>), 200)]
    public async Task<IActionResult> GetActiveCheckouts()
    {
        var result = await _checkoutService.GetActiveCustodyAsync();
        return Ok(result);
    }
}
