using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Data.Configurations;

public class SerializedEquipmentConfiguration : IEntityTypeConfiguration<SerializedEquipment>
{
    public void Configure(EntityTypeBuilder<SerializedEquipment> builder)
    {
        builder.ToTable("SerializedEquipment");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.SerialNumber)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(e => e.RequiresApproval)
            .IsRequired();

        builder.Property(e => e.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(e => e.RowVersion)
            .IsRowVersion();

        builder.HasOne(e => e.Approver)
            .WithMany(p => p.ApprovedEquipment)
            .HasForeignKey(e => e.ApproverId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
