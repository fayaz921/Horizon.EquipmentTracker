using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Horizon.EquipmentTracker.Api.Common;

/// <summary>
/// Action filter verifying the presence and cryptographic correctness of the X-Admin-PIN header.
/// Rejects unauthorized requests with HTTP 401 ProblemDetails.
/// </summary>
public class AdminAuthorizationFilter : IAsyncActionFilter
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminAuthorizationFilter> _logger;

    public AdminAuthorizationFilter(IConfiguration configuration, ILogger<AdminAuthorizationFilter> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var expectedHash = _configuration["Security:AdminPinHash"];
        if (string.IsNullOrWhiteSpace(expectedHash))
        {
            _logger.LogError("Security:AdminPinHash is not configured.");
            context.Result = new ObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Configuration Error",
                Detail = "Admin PIN hash is not configured on the server."
            })
            {
                StatusCode = StatusCodes.Status500InternalServerError
            };
            return;
        }

        if (!context.HttpContext.Request.Headers.TryGetValue("X-Admin-PIN", out var pinValues) ||
            string.IsNullOrWhiteSpace(pinValues))
        {
            context.Result = new ObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized",
                Detail = "Missing X-Admin-PIN header."
            })
            {
                StatusCode = StatusCodes.Status401Unauthorized
            };
            return;
        }

        string rawPin = pinValues.ToString();
        if (!PinHasher.VerifyPin(rawPin, expectedHash))
        {
            _logger.LogWarning("Admin PIN verification failed.");
            context.Result = new ObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized",
                Detail = "Invalid X-Admin-PIN."
            })
            {
                StatusCode = StatusCodes.Status401Unauthorized
            };
            return;
        }

        await next();
    }
}

/// <summary>
/// Attribute to enforce Admin PIN authorization on controller classes or actions.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AdminAuthorizeAttribute : TypeFilterAttribute
{
    public AdminAuthorizeAttribute() : base(typeof(AdminAuthorizationFilter))
    {
    }
}
