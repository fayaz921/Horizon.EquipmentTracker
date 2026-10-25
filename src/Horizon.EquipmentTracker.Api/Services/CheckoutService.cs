using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Horizon.EquipmentTracker.Api.Common;
using Horizon.EquipmentTracker.Api.Data;
using Horizon.EquipmentTracker.Api.Dtos;
using Horizon.EquipmentTracker.Api.Mapping;
using Horizon.EquipmentTracker.Api.Models.Entities;
using Horizon.EquipmentTracker.Api.Models.Enums;

namespace Horizon.EquipmentTracker.Api.Services;

/// <summary>
/// Domain service encapsulating checkout business rules, availability enforcement,
/// dual-attribution recording, delinquency evaluation, due date extensions, and concurrency conflict handling (AD-3, AD-4, AD-8, AD-11).
/// Uses EquipmentTrackerDbContext directly — no repository wrapper.
/// </summary>
public class CheckoutService
{
    private readonly EquipmentTrackerDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CheckoutService> _logger;

    public CheckoutService(
        EquipmentTrackerDbContext db,
        IConfiguration configuration,
        ILogger<CheckoutService> logger)
    {
        _db = db;
        _configuration = configuration;
        _logger = logger;
    }

    // -----------------------------------------------------------------------
    // Checkout creation
    // -----------------------------------------------------------------------

    /// <summary>
    /// Creates a multi-line checkout event. Validates availability, enforces dual
    /// attribution, transitions serialized assets to Out (or PendingApproval), and
    /// decrements counted inventory pools.
    /// </summary>
    /// <exception cref="ArgumentException">Thrown when business validation fails (returns 400).</exception>
    /// <exception cref="InvalidOperationException">Thrown when an item is unavailable (returns 409 from controller).</exception>
    /// <exception cref="DbUpdateConcurrencyException">Propagated to controller for HTTP 409 mapping (AD-3).</exception>
    public async Task<CheckoutResponseDto> CreateCheckoutAsync(CreateCheckoutRequestDto request)
    {
        if (request.Lines is null || request.Lines.Count == 0)
            throw new ArgumentException("At least one checkout line is required.");

        // --- Validate LoggedBy person ---
        var loggedBy = await _db.Personnel
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.LoggedById && p.IsActive)
            ?? throw new ArgumentException($"LoggedBy person with Id {request.LoggedById} not found or is inactive.");

        // --- Validate and check each line ---
        var checkoutLines = new List<CheckoutLine>();

        foreach (var lineDto in request.Lines)
        {
            // Must have exactly one of SerializedEquipmentId or CountedInventoryId
            bool hasSerial = lineDto.SerializedEquipmentId.HasValue;
            bool hasCounted = lineDto.CountedInventoryId.HasValue;

            if (hasSerial == hasCounted)
                throw new ArgumentException(
                    "Each checkout line must specify exactly one of SerializedEquipmentId or CountedInventoryId.");

            // Validate Recipient
            var recipient = await _db.Personnel
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == lineDto.RecipientId && p.IsActive)
                ?? throw new ArgumentException($"Recipient with Id {lineDto.RecipientId} not found or is inactive.");

            // Validate expected return date
            if (lineDto.ExpectedReturnDate == default)
                throw new ArgumentException("ExpectedReturnDate is required for every checkout line.");

            if (hasSerial)
            {
                var line = await PrepareSerializedLineAsync(lineDto);
                checkoutLines.Add(line);
            }
            else
            {
                var line = await PrepareCountedLineAsync(lineDto);
                checkoutLines.Add(line);
            }
        }

        // --- Persist the checkout event ---
        var checkoutEvent = new CheckoutEvent
        {
            LoggedById = request.LoggedById,
            CheckoutTimestamp = DateTime.UtcNow,
            Lines = checkoutLines
        };

        await _db.CheckoutEvents.AddAsync(checkoutEvent);

        // DbUpdateConcurrencyException propagates to controller (AD-3)
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Checkout event {EventId} created with {LineCount} line(s) by LoggedBy={LoggedById}.",
            checkoutEvent.Id, checkoutLines.Count, request.LoggedById);

        // Reload with navigation properties for mapping
        var saved = await _db.CheckoutEvents
            .Include(e => e.LoggedBy)
            .Include(e => e.Lines)
                .ThenInclude(l => l.Recipient)
            .Include(e => e.Lines)
                .ThenInclude(l => l.SerializedEquipment)
            .Include(e => e.Lines)
                .ThenInclude(l => l.CountedInventory)
            .FirstAsync(e => e.Id == checkoutEvent.Id);

        return saved.ToResponseDto();
    }

    // -----------------------------------------------------------------------
    // Active custody query
    // -----------------------------------------------------------------------

    /// <summary>
    /// Returns all open (non-closed) checkout lines with recipient, equipment, and extension log details.
    /// </summary>
    public async Task<IReadOnlyList<ActiveCustodyLineDto>> GetActiveCustodyAsync()
    {
        var lines = await _db.CheckoutLines
            .Where(l => !l.IsClosed &&
                        (l.SerializedEquipment == null || l.SerializedEquipment.Status == EquipmentStatus.Out))
            .Include(l => l.CheckoutEvent)
            .Include(l => l.Recipient)
            .Include(l => l.SerializedEquipment)
            .Include(l => l.CountedInventory)
            .Include(l => l.ExtensionLogs)
            .OrderBy(l => l.ExpectedReturnDate)
            .ToListAsync();

        return lines.Select(l => l.ToActiveCustodyDto()).ToList().AsReadOnly();
    }

    // -----------------------------------------------------------------------
    // Due Date Extension (Story 4.2 / AD-8)
    // -----------------------------------------------------------------------

    /// <summary>
    /// Extends the expected return date of an active checkout line.
    /// Holders can self-extend until 23:59:59 PKT on the return date.
    /// Once overdue (00:00 PKT on D+1), extending requires a valid X-Admin-PIN.
    /// Appends an immutable record to DueDateExtensionLog and updates CheckoutLine.ExpectedReturnDate.
    /// </summary>
    /// <exception cref="KeyNotFoundException">CheckoutLine not found.</exception>
    /// <exception cref="InvalidOperationException">Line is already closed.</exception>
    /// <exception cref="ArgumentException">Invalid new date or unknown personnel.</exception>
    /// <exception cref="UnauthorizedAccessException">Line is overdue and Admin PIN is missing or invalid.</exception>
    public async Task<DueDateExtensionResponseDto> ExtendDueDateAsync(
        int lineId,
        ExtendDueDateRequestDto request,
        string? adminPinHeader = null)
    {
        var line = await _db.CheckoutLines
            .Include(l => l.ExtensionLogs)
            .FirstOrDefaultAsync(l => l.Id == lineId)
            ?? throw new KeyNotFoundException($"CheckoutLine with Id {lineId} not found.");

        if (line.IsClosed)
            throw new InvalidOperationException($"CheckoutLine {lineId} is already closed and cannot be extended.");

        var extendedBy = await _db.Personnel
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ExtendedById && p.IsActive)
            ?? throw new ArgumentException($"Personnel with Id {request.ExtendedById} not found or is inactive.");

        if (request.NewExpectedReturnDate <= line.ExpectedReturnDate)
            throw new ArgumentException(
                $"New expected return date ({request.NewExpectedReturnDate:yyyy-MM-dd}) must be later than current expected return date ({line.ExpectedReturnDate:yyyy-MM-dd}).");

        // AD-8 Delinquency Gate: If line is overdue in PKT, Admin PIN is strictly required.
        bool isOverdue = line.ExpectedReturnDate.IsOverdue();
        if (isOverdue)
        {
            var expectedHash = _configuration["Security:AdminPinHash"];
            if (string.IsNullOrWhiteSpace(adminPinHeader) || !PinHasher.VerifyPin(adminPinHeader, expectedHash))
            {
                _logger.LogWarning("Admin PIN verification failed for overdue extension on line {LineId}.", lineId);
                throw new UnauthorizedAccessException("Extending an overdue checkout line requires a valid Admin PIN.");
            }
        }

        var previousDate = line.ExpectedReturnDate;
        line.ExpectedReturnDate = request.NewExpectedReturnDate;

        var extensionLog = new DueDateExtensionLog
        {
            CheckoutLineId = line.Id,
            PreviousDate = previousDate,
            NewDate = request.NewExpectedReturnDate,
            ExtendedById = request.ExtendedById,
            Timestamp = DateTime.UtcNow
        };

        await _db.DueDateExtensionLogs.AddAsync(extensionLog);
        await _db.SaveChangesAsync();

        int totalExtensions = await _db.DueDateExtensionLogs.CountAsync(x => x.CheckoutLineId == line.Id);

        _logger.LogInformation(
            "Checkout line {LineId} extended from {PrevDate} to {NewDate} by {ExtendedByName} (Total extensions: {Total}). Overdue gate applied: {IsOverdue}.",
            line.Id, previousDate, request.NewExpectedReturnDate, extendedBy.Name, totalExtensions, isOverdue);

        return extensionLog.ToExtensionResponseDto(extendedBy.Name, totalExtensions);
    }


    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private async Task<CheckoutLine> PrepareSerializedLineAsync(CheckoutLineRequestDto lineDto)
    {
        // Lock the row for concurrency (AD-3)
        var item = await _db.SerializedEquipment
            .FirstOrDefaultAsync(e => e.Id == lineDto.SerializedEquipmentId!.Value)
            ?? throw new ArgumentException(
                $"SerializedEquipment with Id {lineDto.SerializedEquipmentId} not found.");

        if (!item.IsActive)
            throw new InvalidOperationException(
                $"'{item.Name}' is deactivated and cannot be checked out.");

        // Status-based lockout (AD-3, FR-7)
        if (item.Status != EquipmentStatus.Available)
            throw new InvalidOperationException(
                $"'{item.Name}' cannot be checked out because its current status is '{item.Status}'. " +
                "Only items with status 'Available' can be checked out.");

        // Transition: items requiring approval go to PendingApproval (AD-5)
        if (item.RequiresApproval)
        {
            item.Status = EquipmentStatus.PendingApproval;
        }
        else
        {
            item.Status = EquipmentStatus.Out;
        }

        return new CheckoutLine
        {
            RecipientId = lineDto.RecipientId,
            SerializedEquipmentId = item.Id,
            Quantity = 1, // Always 1 for serialized items
            ExpectedReturnDate = lineDto.ExpectedReturnDate,
            IsClosed = false
        };
    }

    private async Task<CheckoutLine> PrepareCountedLineAsync(CheckoutLineRequestDto lineDto)
    {
        // Lock the row for concurrency (AD-3)
        var pool = await _db.CountedInventory
            .FirstOrDefaultAsync(c => c.Id == lineDto.CountedInventoryId!.Value)
            ?? throw new ArgumentException(
                $"CountedInventory with Id {lineDto.CountedInventoryId} not found.");

        int requested = lineDto.Quantity;
        if (requested < 1)
            throw new ArgumentException("Quantity must be at least 1.");

        // Availability lockout (AD-3, FR-7)
        if (pool.AvailableQuantity < requested)
            throw new InvalidOperationException(
                $"Insufficient quantity for '{pool.Name}'. " +
                $"Requested: {requested}, Available: {pool.AvailableQuantity}.");

        pool.QuantityOut += requested;

        return new CheckoutLine
        {
            RecipientId = lineDto.RecipientId,
            CountedInventoryId = pool.Id,
            Quantity = requested,
            ExpectedReturnDate = lineDto.ExpectedReturnDate,
            IsClosed = false
        };
    }
}
