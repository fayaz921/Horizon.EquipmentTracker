using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Horizon.EquipmentTracker.Api.Models.Entities;

namespace Horizon.EquipmentTracker.Api.Data.Configurations;

public class SurveyKitConfiguration : IEntityTypeConfiguration<SurveyKit>
{
    public void Configure(EntityTypeBuilder<SurveyKit> builder)
    {
        builder.ToTable("SurveyKits");

        builder.HasKey(k => k.Id);

        builder.Property(k => k.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(k => k.Description)
            .HasMaxLength(500);

        builder.Property(k => k.ItemJson)
            .IsRequired();
    }
}
