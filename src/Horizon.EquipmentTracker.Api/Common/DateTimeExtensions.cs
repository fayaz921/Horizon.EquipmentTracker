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

    public static int GetDaysDelinquent(this DateOnly expectedReturnDate)
    {
        var today = GetCurrentPktDate();
        if (expectedReturnDate < today)
        {
            return today.DayNumber - expectedReturnDate.DayNumber;
        }
        return 0;
    }

    public static string GetDelinquencyStatus(this DateOnly expectedReturnDate)
    {
        if (expectedReturnDate.IsOverdue()) return "Overdue";
        if (expectedReturnDate.IsDueToday()) return "Due Today";
        return "On Loan";
    }

    /// <summary>
    /// Converts a PKT calendar date at 00:00:00 to UTC DateTime.
    /// </summary>
    public static DateTime PktDateStartToUtc(this DateOnly date)
    {
        var pktDt = date.ToDateTime(TimeOnly.MinValue);
        return TimeZoneInfo.ConvertTimeToUtc(pktDt, PktTimeZone);
    }

    /// <summary>
    /// Converts a PKT calendar date at 23:59:59.999 to UTC DateTime.
    /// </summary>
    public static DateTime PktDateEndToUtc(this DateOnly date)
    {
        var pktDt = date.ToDateTime(new TimeOnly(23, 59, 59, 999));
        return TimeZoneInfo.ConvertTimeToUtc(pktDt, PktTimeZone);
    }
}
