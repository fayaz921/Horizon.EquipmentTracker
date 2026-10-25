using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Data.Configurations;

public class CheckoutEventConfiguration : IEntityTypeConfiguration<CheckoutEvent>
{
    public void Configure(EntityTypeBuilder<CheckoutEvent> builder)
    {
        builder.ToTable("CheckoutEvents");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.CheckoutTimestamp)
            .IsRequired();

        builder.HasOne(e => e.LoggedBy)
            .WithMany(p => p.LoggedEvents)
            .HasForeignKey(e => e.LoggedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
