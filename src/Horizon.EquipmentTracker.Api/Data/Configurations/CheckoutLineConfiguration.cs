using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Data.Configurations;

public class CheckoutLineConfiguration : IEntityTypeConfiguration<CheckoutLine>
{
    public void Configure(EntityTypeBuilder<CheckoutLine> builder)
    {
        builder.ToTable("CheckoutLines");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Quantity)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(l => l.ExpectedReturnDate)
            .IsRequired()
            .HasColumnType("date");

        builder.Property(l => l.ActualReturnTimestamp);

        builder.Property(l => l.ReturnCondition)
            .HasConversion<int>();

        builder.Property(l => l.ConditionNotes)
            .HasMaxLength(500);

        builder.Property(l => l.IsClosed)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(l => l.RowVersion)
            .IsRowVersion();

        builder.HasOne(l => l.CheckoutEvent)
            .WithMany(e => e.Lines)
            .HasForeignKey(l => l.CheckoutEventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(l => l.Recipient)
            .WithMany(p => p.CustodyLines)
            .HasForeignKey(l => l.RecipientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(l => l.SerializedEquipment)
            .WithMany(e => e.CheckoutLines)
            .HasForeignKey(l => l.SerializedEquipmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(l => l.CountedInventory)
            .WithMany(i => i.CheckoutLines)
            .HasForeignKey(l => l.CountedInventoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
