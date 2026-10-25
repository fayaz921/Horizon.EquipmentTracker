using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Horizon.EquipmentTracker.Api.Common;
using Horizon.EquipmentTracker.Api.Data;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Mapping;
using Horizon.EquipmentTracker.Api.Models.Entities;
using Horizon.EquipmentTracker.Api.Models.Enums;

namespace Horizon.EquipmentTracker.Api.Services;

/// <summary>
/// Domain service encapsulating approval queue queries, personal Approver PIN verification,
/// custody release, and pending request cancellation (AD-3, AD-5, AD-11).
/// Uses EquipmentTrackerDbContext directly — no repository wrapper.
/// </summary>
public class ApprovalService
{
    private readonly EquipmentTrackerDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ApprovalService> _logger;

    public ApprovalService(
        EquipmentTrackerDbContext db,
        IConfiguration configuration,
        ILogger<ApprovalService> logger)
    {
        _db = db;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Returns all open checkout lines for serialized items currently in PendingApproval status.
    /// </summary>
    public async Task<IReadOnlyList<PendingApprovalDto>> GetPendingApprovalsAsync()
    {
        var lines = await _db.CheckoutLines
            .Where(l => !l.IsClosed &&
                        l.SerializedEquipment != null &&
                        l.SerializedEquipment.Status == EquipmentStatus.PendingApproval)
            .Include(l => l.CheckoutEvent)
                .ThenInclude(e => e.LoggedBy)
            .Include(l => l.Recipient)
            .Include(l => l.SerializedEquipment)
                .ThenInclude(e => e!.Approver)
            .OrderBy(l => l.CheckoutEvent.CheckoutTimestamp)
            .ToListAsync();

        return lines.Select(l => l.ToPendingApprovalDto()).ToList().AsReadOnly();
    }

    /// <summary>
    /// Approves a pending checkout line upon verification of the designated approver's PIN.
    /// Releases the restricted asset to Out status.
    /// Rejects incorrect PINs and strictly forbids admin overrides (AD-5).
    /// </summary>
    /// <exception cref="KeyNotFoundException">Line not found.</exception>
    /// <exception cref="InvalidOperationException">Line is closed or not pending approval.</exception>
    /// <exception cref="UnauthorizedAccessException">Invalid Approver PIN or attempt to use Admin PIN.</exception>
    /// <exception cref="DbUpdateConcurrencyException">Propagated to controller for HTTP 409 mapping (AD-3).</exception>
    public async Task<ApprovalResponseDto> ApproveRequestAsync(int lineId, ApproveRequestDto request)
    {
        var line = await _db.CheckoutLines
            .Include(l => l.SerializedEquipment)
                .ThenInclude(e => e!.Approver)
            .Include(l => l.Recipient)
            .FirstOrDefaultAsync(l => l.Id == lineId)
            ?? throw new KeyNotFoundException($"CheckoutLine with Id {lineId} not found.");

        if (line.IsClosed)
            throw new InvalidOperationException($"CheckoutLine {lineId} is already closed.");

        if (line.SerializedEquipment == null || line.SerializedEquipment.Status != EquipmentStatus.PendingApproval)
            throw new InvalidOperationException(
                $"CheckoutLine {lineId} cannot be approved because item status is '{line.SerializedEquipment?.Status}'. Only items in 'PendingApproval' can be approved.");

        var approverPinHash = _configuration["Security:ApproverPinHash"];
        if (string.IsNullOrWhiteSpace(approverPinHash))
            throw new InvalidOperationException("Security:ApproverPinHash is not configured on the server.");

        // AD-5: Strictly verify approver PIN; reject wrong PIN and forbid admin overrides
        if (!PinHasher.VerifyPin(request.ApproverPin, approverPinHash))
        {
            _logger.LogWarning("Approval failed for Line {LineId}: invalid approver PIN.", lineId);
            throw new UnauthorizedAccessException("Invalid Approver PIN. Admin overrides are strictly prohibited.");
        }

        // Release restricted item to Out
        line.SerializedEquipment.Status = EquipmentStatus.Out;

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "CheckoutLine {LineId} ('{EquipmentName}') successfully approved and released to Recipient {RecipientName}.",
            line.Id, line.SerializedEquipment.Name, line.Recipient.Name);

        return line.ToApprovalResponseDto(DateTime.UtcNow);
    }

    /// <summary>
    /// Cancels a pending checkout request and restores the serialized asset to Available status.
    /// </summary>
    /// <exception cref="KeyNotFoundException">Line not found.</exception>
    /// <exception cref="InvalidOperationException">Line is closed or not pending approval.</exception>
    /// <exception cref="DbUpdateConcurrencyException">Propagated to controller for HTTP 409 mapping (AD-3).</exception>
    public async Task<CancelApprovalResponseDto> CancelRequestAsync(int lineId)
    {
        var line = await _db.CheckoutLines
            .Include(l => l.SerializedEquipment)
            .FirstOrDefaultAsync(l => l.Id == lineId)
            ?? throw new KeyNotFoundException($"CheckoutLine with Id {lineId} not found.");

        if (line.IsClosed)
            throw new InvalidOperationException($"CheckoutLine {lineId} is already closed.");

        if (line.SerializedEquipment == null || line.SerializedEquipment.Status != EquipmentStatus.PendingApproval)
            throw new InvalidOperationException(
                $"CheckoutLine {lineId} cannot be cancelled because item status is '{line.SerializedEquipment?.Status}'. Only items in 'PendingApproval' can be cancelled.");

        // Clear checkout line and restore asset to Available
        line.IsClosed = true;
        line.ActualReturnTimestamp = DateTime.UtcNow;
        line.ConditionNotes = "Request cancelled prior to custody release.";
        line.SerializedEquipment.Status = EquipmentStatus.Available;

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "CheckoutLine {LineId} ('{EquipmentName}') cancelled. Asset restored to Available.",
            line.Id, line.SerializedEquipment.Name);

        return line.ToCancelApprovalResponseDto(DateTime.UtcNow);
    }
}
