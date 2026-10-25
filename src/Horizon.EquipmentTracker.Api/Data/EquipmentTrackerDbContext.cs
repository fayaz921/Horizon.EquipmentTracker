using Microsoft.EntityFrameworkCore;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Data;

public class EquipmentTrackerDbContext : DbContext
{
    public EquipmentTrackerDbContext(DbContextOptions<EquipmentTrackerDbContext> options)
        : base(options)
    {
    }

    public DbSet<Personnel> Personnel => Set<Personnel>();
    public DbSet<SerializedEquipment> SerializedEquipment => Set<SerializedEquipment>();
    public DbSet<CountedInventory> CountedInventory => Set<CountedInventory>();
    public DbSet<CheckoutEvent> CheckoutEvents => Set<CheckoutEvent>();
    public DbSet<CheckoutLine> CheckoutLines => Set<CheckoutLine>();
    public DbSet<DueDateExtensionLog> DueDateExtensionLogs => Set<DueDateExtensionLog>();
    public DbSet<SurveyKit> SurveyKits => Set<SurveyKit>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(EquipmentTrackerDbContext).Assembly);
    }
}
