using System.Text.Json;
using LegoWebAppBlazor.Models;

namespace LegoWebAppBlazor.Services;

/// <summary>
/// Calls Supabase's REST API for authentication (login and signup).
/// The HttpClient is pre-configured with the Supabase base URL and API key.
/// </summary>
public class SupabaseAuthService
{
    private readonly HttpClient _http;

    public SupabaseAuthService(HttpClient http)
    {
        _http = http;
    }

    /// Log in with email + password. Returns a JWT access token on success.
    public async Task<AuthResult> LoginAsync(string email, string password)
    {
        var body = JsonContent.Create(new { email, password });
        var response = await _http.PostAsync("/auth/v1/token?grant_type=password", body);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        if (!response.IsSuccessStatusCode)
        {
            var msg = json.TryGetProperty("error_description", out var ed) ? ed.GetString()
                    : "Invalid email or password";
            return new AuthResult(false, null, msg);
        }

        var token = json.GetProperty("access_token").GetString();
        return new AuthResult(true, token, null);
    }

    /// Create a new account. May return a JWT immediately if email confirmation is disabled.
    public async Task<AuthResult> SignUpAsync(string email, string password)
    {
        var body = JsonContent.Create(new { email, password });
        var response = await _http.PostAsync("/auth/v1/signup", body);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        if (!response.IsSuccessStatusCode)
        {
            var msg = json.TryGetProperty("msg", out var m) ? m.GetString()
                    : json.TryGetProperty("error_description", out var ed) ? ed.GetString()
                    : "Signup failed";
            return new AuthResult(false, null, msg);
        }

        if (json.TryGetProperty("access_token", out var tokenProp))
        {
            return new AuthResult(true, tokenProp.GetString(), null);
        }

        return new AuthResult(true, null, "Check your email to confirm your account.");
    }
}
