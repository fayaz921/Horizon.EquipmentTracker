using Horizon.EquipmentTracker.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<EquipmentTrackerDbContext>(options =>
    options.UseSqlServer(connectionString));

// Domain service registrations (AD-11)
builder.Services.AddScoped<Horizon.EquipmentTracker.Api.Services.PersonnelService>();
builder.Services.AddScoped<Horizon.EquipmentTracker.Api.Services.EquipmentService>();
builder.Services.AddScoped<Horizon.EquipmentTracker.Api.Services.CheckoutService>();
builder.Services.AddScoped<Horizon.EquipmentTracker.Api.Services.ReturnService>();
builder.Services.AddScoped<Horizon.EquipmentTracker.Api.Services.ApprovalService>();
builder.Services.AddScoped<Horizon.EquipmentTracker.Api.Services.AdminService>();
builder.Services.AddScoped<Horizon.EquipmentTracker.Api.Common.AdminAuthorizationFilter>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Cold-boot automatic database migration and seeding
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = services.GetRequiredService<EquipmentTrackerDbContext>();
        logger.LogInformation("Applying EF Core database migrations...");
        await dbContext.Database.MigrateAsync();
        logger.LogInformation("EF Core migrations applied successfully.");

        logger.LogInformation("Executing database seeding routine...");
        await DatabaseSeeder.SeedAsync(dbContext, logger);
        logger.LogInformation("Database startup pipeline completed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred during database migration or seeding.");
        throw;
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
