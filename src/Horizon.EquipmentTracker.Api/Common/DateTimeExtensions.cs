using System;

namespace Horizon.EquipmentTracker.Api.Common;

public static class DateTimeExtensions
{
    private static readonly TimeZoneInfo PktTimeZone = ResolvePktTimeZone();

    private static TimeZoneInfo ResolvePktTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Pakistan Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Karachi");
        }
    }

    public static DateTime ToPktDateTime(this DateTime utcDateTime)
    {
        var utc = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
        return TimeZoneInfo.ConvertTimeFromUtc(utc, PktTimeZone);
    }

    public static DateTime ToPktDateTime(this DateTimeOffset utcDateTimeOffset)
    {
        return TimeZoneInfo.ConvertTime(utcDateTimeOffset, PktTimeZone).DateTime;
    }

    public static DateOnly GetCurrentPktDate()
    {
        var pktNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, PktTimeZone);
        return DateOnly.FromDateTime(pktNow);
    }

    public static bool IsOverdue(this DateOnly expectedReturnDate)
    {
        return expectedReturnDate < GetCurrentPktDate();
    }

    public static bool IsDueToday(this DateOnly expectedReturnDate)
    {
        return expectedReturnDate == GetCurrentPktDate();
    }
}
