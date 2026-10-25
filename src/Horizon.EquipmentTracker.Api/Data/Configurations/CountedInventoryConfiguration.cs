using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Data.Configurations;

public class CountedInventoryConfiguration : IEntityTypeConfiguration<CountedInventory>
{
    public void Configure(EntityTypeBuilder<CountedInventory> builder)
    {
        builder.ToTable("CountedInventory");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(i => i.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(i => i.TotalQuantity)
            .IsRequired();

        builder.Property(i => i.QuantityOut)
            .IsRequired();

        builder.Property(i => i.QuantityInInspection)
            .IsRequired();

        builder.Property(i => i.RowVersion)
            .IsRowVersion();
    }
}
