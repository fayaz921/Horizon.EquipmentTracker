using System;
using System.Security.Cryptography;
using System.Text;

namespace Horizon.EquipmentTracker.Api.Common;

public static class PinHasher
{
    public static string HashPin(string pin)
    {
        if (string.IsNullOrWhiteSpace(pin))
        {
            return string.Empty;
        }

        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(pin.Trim()));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static bool VerifyPin(string pin, string? expectedHash)
    {
        if (string.IsNullOrWhiteSpace(pin) || string.IsNullOrWhiteSpace(expectedHash))
        {
            return false;
        }

        string computedHash = HashPin(pin);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedHash),
            Encoding.UTF8.GetBytes(expectedHash.ToLowerInvariant())
        );
    }
}
