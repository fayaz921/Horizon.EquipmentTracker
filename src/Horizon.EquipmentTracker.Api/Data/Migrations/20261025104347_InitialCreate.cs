using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Horizon.EquipmentTracker.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CountedInventory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TotalQuantity = table.Column<int>(type: "int", nullable: false),
                    QuantityOut = table.Column<int>(type: "int", nullable: false),
                    QuantityInInspection = table.Column<int>(type: "int", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountedInventory", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Personnel",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Personnel", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SurveyKits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ItemJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SurveyKits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CheckoutEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoggedById = table.Column<int>(type: "int", nullable: false),
                    CheckoutTimestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckoutEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CheckoutEvents_Personnel_LoggedById",
                        column: x => x.LoggedById,
                        principalTable: "Personnel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SerializedEquipment",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SerialNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RequiresApproval = table.Column<bool>(type: "bit", nullable: false),
                    ApproverId = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SerializedEquipment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SerializedEquipment_Personnel_ApproverId",
                        column: x => x.ApproverId,
                        principalTable: "Personnel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CheckoutLines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CheckoutEventId = table.Column<int>(type: "int", nullable: false),
                    RecipientId = table.Column<int>(type: "int", nullable: false),
                    SerializedEquipmentId = table.Column<int>(type: "int", nullable: true),
                    CountedInventoryId = table.Column<int>(type: "int", nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    ExpectedReturnDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ActualReturnTimestamp = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReturnCondition = table.Column<int>(type: "int", nullable: true),
                    ConditionNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsClosed = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckoutLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CheckoutLines_CheckoutEvents_CheckoutEventId",
                        column: x => x.CheckoutEventId,
                        principalTable: "CheckoutEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CheckoutLines_CountedInventory_CountedInventoryId",
                        column: x => x.CountedInventoryId,
                        principalTable: "CountedInventory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CheckoutLines_Personnel_RecipientId",
                        column: x => x.RecipientId,
                        principalTable: "Personnel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CheckoutLines_SerializedEquipment_SerializedEquipmentId",
                        column: x => x.SerializedEquipmentId,
                        principalTable: "SerializedEquipment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DueDateExtensionLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CheckoutLineId = table.Column<int>(type: "int", nullable: false),
                    PreviousDate = table.Column<DateOnly>(type: "date", nullable: false),
                    NewDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ExtendedById = table.Column<int>(type: "int", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DueDateExtensionLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DueDateExtensionLogs_CheckoutLines_CheckoutLineId",
                        column: x => x.CheckoutLineId,
                        principalTable: "CheckoutLines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DueDateExtensionLogs_Personnel_ExtendedById",
                        column: x => x.ExtendedById,
                        principalTable: "Personnel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutEvents_LoggedById",
                table: "CheckoutEvents",
                column: "LoggedById");

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutLines_CheckoutEventId",
                table: "CheckoutLines",
                column: "CheckoutEventId");

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutLines_CountedInventoryId",
                table: "CheckoutLines",
                column: "CountedInventoryId");

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutLines_RecipientId",
                table: "CheckoutLines",
                column: "RecipientId");

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutLines_SerializedEquipmentId",
                table: "CheckoutLines",
                column: "SerializedEquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_DueDateExtensionLogs_CheckoutLineId",
                table: "DueDateExtensionLogs",
                column: "CheckoutLineId");

            migrationBuilder.CreateIndex(
                name: "IX_DueDateExtensionLogs_ExtendedById",
                table: "DueDateExtensionLogs",
                column: "ExtendedById");

            migrationBuilder.CreateIndex(
                name: "IX_SerializedEquipment_ApproverId",
                table: "SerializedEquipment",
                column: "ApproverId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DueDateExtensionLogs");

            migrationBuilder.DropTable(
                name: "SurveyKits");

            migrationBuilder.DropTable(
                name: "CheckoutLines");

            migrationBuilder.DropTable(
                name: "CheckoutEvents");

            migrationBuilder.DropTable(
                name: "CountedInventory");

            migrationBuilder.DropTable(
                name: "SerializedEquipment");

            migrationBuilder.DropTable(
                name: "Personnel");
        }
    }
}
