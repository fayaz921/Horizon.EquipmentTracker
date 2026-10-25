using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Data.Configurations;

public class DueDateExtensionLogConfiguration : IEntityTypeConfiguration<DueDateExtensionLog>
{
    public void Configure(EntityTypeBuilder<DueDateExtensionLog> builder)
    {
        builder.ToTable("DueDateExtensionLogs");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.PreviousDate)
            .IsRequired()
            .HasColumnType("date");

        builder.Property(x => x.NewDate)
            .IsRequired()
            .HasColumnType("date");

        builder.Property(x => x.Timestamp)
            .IsRequired();

        builder.HasOne(x => x.CheckoutLine)
            .WithMany(l => l.ExtensionLogs)
            .HasForeignKey(x => x.CheckoutLineId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.ExtendedBy)
            .WithMany(p => p.AuthorizedExtensions)
            .HasForeignKey(x => x.ExtendedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
