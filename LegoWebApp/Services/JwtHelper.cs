using System.Text.Json;

namespace LegoWebApp.Services;

public static class JwtHelper
{
    public static T? DecodeClaim<T>(string jwt, string claim)
    {
        try
        {
            var parts = jwt.Split('.');
            if (parts.Length != 3) return default;
            var padding = (4 - parts[1].Length % 4) % 4;
            var base64 = parts[1].Replace('-', '+').Replace('_', '/') + new string('=', padding);
            var json = JsonSerializer.Deserialize<JsonElement>(Convert.FromBase64String(base64));
            if (!json.TryGetProperty(claim, out var value)) return default;
            return value.Deserialize<T>();
        }
        catch { return default; }
    }
}
