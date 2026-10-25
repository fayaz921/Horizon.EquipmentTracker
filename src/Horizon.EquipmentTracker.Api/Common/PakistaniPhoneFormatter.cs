using System;
using System.Text.RegularExpressions;

namespace Horizon.EquipmentTracker.Api.Common;

/// <summary>
/// Phone formatting and WhatsApp URI generation utility strictly matching Pakistani phone conventions (AD-9).
/// Normalizes local Pakistani numbers (e.g. 03001234567, +923001234567) to international digits without '+' (923001234567).
/// </summary>
public static class PakistaniPhoneFormatter
{
    private static readonly Regex NonDigitRegex = new(@"\D", RegexOptions.Compiled);

    /// <summary>
    /// Normalizes a Pakistani phone number to international digits without plus signs or spaces (e.g. "923001234567").
    /// </summary>
    public static string FormatToInternational(string? rawPhone)
    {
        if (string.IsNullOrWhiteSpace(rawPhone))
            return string.Empty;

        // Strip all non-digit characters
        string digits = NonDigitRegex.Replace(rawPhone.Trim(), string.Empty);

        // Case 1: Local mobile format starting with 03 (e.g. 03001234567 -> 11 digits)
        if (digits.StartsWith("03") && digits.Length == 11)
        {
            return "92" + digits[1..];
        }

        // Case 2: Local mobile without leading 0 (e.g. 3001234567 -> 10 digits)
        if (digits.StartsWith("3") && digits.Length == 10)
        {
            return "92" + digits;
        }

        // Case 3: Already international starting with 92 (e.g. 923001234567 -> 12 digits)
        if (digits.StartsWith("92") && digits.Length == 12)
        {
            return digits;
        }

        // Case 4: Starts with 0092 (international dialing prefix)
        if (digits.StartsWith("0092") && digits.Length == 14)
        {
            return digits[2..];
        }

        return digits;
    }

    /// <summary>
    /// Constructs a standardized pre-encoded wa.me reminder message URL for Due Today and Overdue checkout lines.
    /// Returns null if the line is neither Due Today nor Overdue, or if no phone number is available.
    /// </summary>
    public static string? BuildWhatsAppReminderUrl(
        string? rawPhone,
        string recipientName,
        string equipmentName,
        DateOnly expectedReturnDate,
        bool isOverdue,
        bool isDueToday)
    {
        if (!isOverdue && !isDueToday)
            return null;

        string formattedPhone = FormatToInternational(rawPhone);
        if (string.IsNullOrWhiteSpace(formattedPhone))
            return null;

        string message;
        if (isOverdue)
        {
            message = $"Salam {recipientName}, this is Horizon Survey office. {equipmentName} was due back on {expectedReturnDate:yyyy-MM-dd}. Please bring it back to the office or let Saima know if you need an extension.";
        }
        else // isDueToday
        {
            message = $"Salam {recipientName}, this is Horizon Survey office. {equipmentName} is due back today ({expectedReturnDate:yyyy-MM-dd}). Please bring it back to the office or let Saima know if you need an extension.";
        }

        return $"https://wa.me/{formattedPhone}?text={Uri.EscapeDataString(message)}";
    }
}
