using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Horizon.EquipmentTracker.Api.Common;
using Horizon.EquipmentTracker.Api.Models.Entities;
using Horizon.EquipmentTracker.Api.Models.Enums;

namespace Horizon.EquipmentTracker.Api.Data;

/// <summary>
/// Sample demonstration database seeder for Horizon Survey Services.
/// All records seeded here represent initial sample demonstration data.
/// </summary>
public static class DatabaseSeeder
{
    public static async Task SeedAsync(EquipmentTrackerDbContext context, ILogger logger)
    {
        if (await context.Personnel.AnyAsync())
        {
            logger.LogInformation("Personnel records already exist. Skipping seed.");
            return;
        }

        logger.LogInformation("Seeding sample demonstration data for Horizon Equipment Tracker...");

        // 1. Sample Personnel (7 team members)
        var tariq = new Personnel
        {
            Name = "Tariq",
            Role = "Owner / Admin",
            PhoneNumber = "+923001234561",
            IsActive = true
        };

        var saima = new Personnel
        {
            Name = "Saima",
            Role = "Office Admin",
            PhoneNumber = "+923001234562",
            IsActive = true
        };

        var hamza = new Personnel
        {
            Name = "Hamza",
            Role = "Licensed Drone Pilot / Approver",
            PhoneNumber = "+923001234563",
            IsActive = true
        };

        var ali = new Personnel
        {
            Name = "Ali",
            Role = "Field Surveyor",
            PhoneNumber = "+923001234564",
            IsActive = true
        };

        var bilal = new Personnel
        {
            Name = "Bilal",
            Role = "Field Surveyor",
            PhoneNumber = "+923001234565",
            IsActive = true
        };

        var usman = new Personnel
        {
            Name = "Usman",
            Role = "Field Surveyor",
            PhoneNumber = "+923001234566",
            IsActive = true
        };

        var farhan = new Personnel
        {
            Name = "Farhan",
            Role = "Field Surveyor",
            PhoneNumber = "+923001234567",
            IsActive = true
        };

        var personnelList = new List<Personnel> { tariq, saima, hamza, ali, bilal, usman, farhan };
        await context.Personnel.AddRangeAsync(personnelList);
        await context.SaveChangesAsync();

        // 2. Sample Serialized Equipment
        var totalStation1 = new SerializedEquipment
        {
            Name = "Total Station #1 (Leica TS07)",
            SerialNumber = "TS-1001",
            Category = "Total Station",
            Status = EquipmentStatus.Available,
            RequiresApproval = false,
            ApproverId = null,
            IsActive = true
        };

        var totalStation2 = new SerializedEquipment
        {
            Name = "Total Station #2 (Sokkia iX)",
            SerialNumber = "TS-1002",
            Category = "Total Station",
            Status = EquipmentStatus.Available,
            RequiresApproval = false,
            ApproverId = null,
            IsActive = true
        };

        var gpsRover1 = new SerializedEquipment
        {
            Name = "GPS Rover #1 (Trimble R12)",
            SerialNumber = "GPS-2001",
            Category = "GPS Rover",
            Status = EquipmentStatus.Out, // Currently checked out in sample overdue checkout
            RequiresApproval = false,
            ApproverId = null,
            IsActive = true
        };

        var gpsRover2 = new SerializedEquipment
        {
            Name = "GPS Rover #2 (Trimble R12)",
            SerialNumber = "GPS-2002",
            Category = "GPS Rover",
            Status = EquipmentStatus.Available,
            RequiresApproval = false,
            ApproverId = null,
            IsActive = true
        };

        var drone = new SerializedEquipment
        {
            Name = "Drone",
            SerialNumber = "DRN-3001",
            Category = "Drone",
            Status = EquipmentStatus.Available,
            RequiresApproval = true,
            ApproverId = hamza.Id,
            IsActive = true
        };

        var serializedList = new List<SerializedEquipment> { totalStation1, totalStation2, gpsRover1, gpsRover2, drone };
        await context.SerializedEquipment.AddRangeAsync(serializedList);

        // 3. Sample Counted Inventory Pools
        var tripods = new CountedInventory
        {
            Name = "Heavy-duty Tripods",
            Category = "Tripod",
            TotalQuantity = 4,
            QuantityOut = 0,
            QuantityInInspection = 0
        };

        var tablets = new CountedInventory
        {
            Name = "Rugged Field Tablets (Samsung Active)",
            Category = "Tablet",
            TotalQuantity = 6,
            QuantityOut = 0,
            QuantityInInspection = 0
        };

        var countedList = new List<CountedInventory> { tripods, tablets };
        await context.CountedInventory.AddRangeAsync(countedList);

        // 4. Sample Survey Kit Templates
        var standardKit = new SurveyKit
        {
            Name = "Standard Total Station Kit",
            Description = "Total Station + 1 Tripod (Sample Template)",
            ItemJson = "[{\"category\":\"Total Station\",\"type\":\"serialized\",\"quantity\":1},{\"category\":\"Tripod\",\"type\":\"counted\",\"quantity\":1}]"
        };

        var gpsKit = new SurveyKit
        {
            Name = "GPS RTK Rover Kit",
            Description = "GPS Rover + 1 Field Tablet (Sample Template)",
            ItemJson = "[{\"category\":\"GPS Rover\",\"type\":\"serialized\",\"quantity\":1},{\"category\":\"Tablet\",\"type\":\"counted\",\"quantity\":1}]"
        };

        var kitList = new List<SurveyKit> { standardKit, gpsKit };
        await context.SurveyKits.AddRangeAsync(kitList);
        await context.SaveChangesAsync();

        // 5. Sample Checkouts (Overdue active checkout + Historical closed checkout)
        var todayPkt = DateTimeExtensions.GetCurrentPktDate();

        // Sample Active Overdue Checkout: GPS Rover #1 checked out to Ali 5 days ago, due 2 days ago
        var overdueEvent = new CheckoutEvent
        {
            LoggedById = saima.Id,
            CheckoutTimestamp = DateTime.UtcNow.AddDays(-5)
        };
        await context.CheckoutEvents.AddAsync(overdueEvent);
        await context.SaveChangesAsync();

        var overdueLine = new CheckoutLine
        {
            CheckoutEventId = overdueEvent.Id,
            RecipientId = ali.Id,
            SerializedEquipmentId = gpsRover1.Id,
            Quantity = 1,
            ExpectedReturnDate = todayPkt.AddDays(-2),
            ActualReturnTimestamp = null,
            ReturnCondition = null,
            ConditionNotes = null,
            IsClosed = false
        };
        await context.CheckoutLines.AddAsync(overdueLine);

        // Sample Historical Checkout from last month (returned in good condition)
        var historicalEvent = new CheckoutEvent
        {
            LoggedById = saima.Id,
            CheckoutTimestamp = DateTime.UtcNow.AddDays(-35)
        };
        await context.CheckoutEvents.AddAsync(historicalEvent);
        await context.SaveChangesAsync();

        var historicalLine = new CheckoutLine
        {
            CheckoutEventId = historicalEvent.Id,
            RecipientId = bilal.Id,
            SerializedEquipmentId = totalStation1.Id,
            Quantity = 1,
            ExpectedReturnDate = todayPkt.AddDays(-33),
            ActualReturnTimestamp = DateTime.UtcNow.AddDays(-33),
            ReturnCondition = ReturnCondition.Good,
            ConditionNotes = "Returned in good condition (Sample Data)",
            IsClosed = true
        };
        await context.CheckoutLines.AddAsync(historicalLine);

        await context.SaveChangesAsync();
        logger.LogInformation("Sample demonstration seeding completed successfully.");
    }
}
