using System.Text.Json;
using LegoWebApp.Models;

namespace LegoWebApp.Services;

public class SupabaseAuthService(HttpClient http)
{
    public async Task<AuthResult> LoginAsync(string email, string password)
    {
        var response = await http.PostAsJsonAsync("/auth/v1/token?grant_type=password", new { email, password });
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        if (!response.IsSuccessStatusCode)
            return AuthResult.Fail(ExtractError(json, "Login failed"));

        return AuthResult.Ok(json.GetProperty("access_token").GetString());
    }

    public async Task<AuthResult> SignUpAsync(string email, string password)
    {
        var response = await http.PostAsJsonAsync("/auth/v1/signup", new { email, password });
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        if (!response.IsSuccessStatusCode)
            return AuthResult.Fail(ExtractError(json, "Sign up failed"));

        json.TryGetProperty("access_token", out var tokenEl);
        var token = tokenEl.ValueKind == JsonValueKind.String ? tokenEl.GetString() : null;
        return AuthResult.Ok(token);
    }

    private static string ExtractError(JsonElement json, string fallback)
    {
        if (json.TryGetProperty("error_description", out var d) && d.GetString() is string desc) return desc;
        if (json.TryGetProperty("msg", out var m) && m.GetString() is string msg) return msg;
        return fallback;
    }
}
