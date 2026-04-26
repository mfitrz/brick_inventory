using System.Net.Http.Headers;
using System.Text.Json;
using LegoWebApp.Models;

namespace LegoWebApp.Services;

public class SupabaseAuthService
{
    private const string SupabaseUrl = "https://owffxalcdjmsukmeccid.supabase.co";
    private const string SupabaseAnonKey = "sb_publishable_UWOWVPBxfTipZ3YzCenzkA_uy1_q_Nv";
    private readonly HttpClient http;

    public SupabaseAuthService(HttpClient http)
    {
        this.http = http;
        http.DefaultRequestHeaders.TryAddWithoutValidation("apikey", SupabaseAnonKey);
    }

    public async Task<AuthResult> LoginAsync(string email, string password)
    {
        var response = await http.PostAsJsonAsync($"{SupabaseUrl}/auth/v1/token?grant_type=password", new { email, password });
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        if (!response.IsSuccessStatusCode)
            return AuthResult.Fail(ExtractError(json, "Login failed"));

        return AuthResult.Ok(json.GetProperty("access_token").GetString());
    }

    public async Task<AuthResult> SignUpAsync(string email, string password)
    {
        var response = await http.PostAsJsonAsync($"{SupabaseUrl}/auth/v1/signup", new { email, password });
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        if (!response.IsSuccessStatusCode)
            return AuthResult.Fail(ExtractError(json, "Sign up failed"));

        json.TryGetProperty("access_token", out var tokenEl);
        var token = tokenEl.ValueKind == JsonValueKind.String ? tokenEl.GetString() : null;
        return AuthResult.Ok(token);
    }

    public async Task<bool> SendPasswordResetAsync(string email)
    {
        var response = await http.PostAsJsonAsync($"{SupabaseUrl}/auth/v1/recover", new { email });
        return response.IsSuccessStatusCode;
    }

    public async Task<List<LegoSetDto>> GetAllSetsAsync(string userJwt, string userId)
    {
        var request = new HttpRequestMessage(HttpMethod.Get,
            $"{SupabaseUrl}/rest/v1/lego_sets?user_id=eq.{userId}&select=set_number,name,img_url,ebay_price,set_year");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", userJwt);
        var response = await http.SendAsync(request);
        if (!response.IsSuccessStatusCode) return [];

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var sets = new List<LegoSetDto>();
        foreach (var item in json.EnumerateArray())
        {
            if (!item.TryGetProperty("set_number", out var sn)) continue;
            var name = item.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
            var imgUrl = item.TryGetProperty("img_url", out var img) && img.ValueKind == JsonValueKind.String
                ? img.GetString() : null;
            decimal? price = item.TryGetProperty("ebay_price", out var p) && p.ValueKind == JsonValueKind.Number
                ? p.GetDecimal() : null;
            int? year = item.TryGetProperty("set_year", out var yr) && yr.ValueKind == JsonValueKind.Number
                ? yr.GetInt32() : null;
            sets.Add(new LegoSetDto(sn.GetInt32(), name, imgUrl, price, year));
        }
        return sets;
    }

    public async Task<(bool Success, string Message)> AddSetAsync(
        string userJwt, string userId, int setNumber, string name, string? imgUrl, decimal? ebayPrice = null, int? year = null)
    {
        var insertReq = new HttpRequestMessage(HttpMethod.Post, $"{SupabaseUrl}/rest/v1/lego_sets");
        insertReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", userJwt);
        insertReq.Content = JsonContent.Create(new { user_id = userId, set_number = setNumber, name, img_url = imgUrl, ebay_price = ebayPrice, set_year = year });
        insertReq.Headers.Add("Prefer", "return=minimal");
        var insertRes = await http.SendAsync(insertReq);

        if (insertRes.StatusCode == System.Net.HttpStatusCode.Conflict)
            return (false, "This set is already in your collection.");
        if (!insertRes.IsSuccessStatusCode)
            return (false, "Failed to add set.");

        return (true, "Set added to collection!");
    }

    public async Task<(bool Success, string Message)> DeleteSetAsync(string userJwt, string userId, int setNumber)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete,
            $"{SupabaseUrl}/rest/v1/lego_sets?user_id=eq.{userId}&set_number=eq.{setNumber}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", userJwt);
        request.Headers.Add("Prefer", "count=exact");
        var response = await http.SendAsync(request);
        if (!response.IsSuccessStatusCode) return (false, "Failed to delete set.");

        if (response.Headers.TryGetValues("Content-Range", out var values) &&
            values.FirstOrDefault()?.Split('/').Last() == "0")
            return (false, "Set not found in your collection.");

        return (true, "Set removed from collection.");
    }

    public async Task<(bool Success, string Message)> DeleteAllSetsAsync(string userJwt, string userId)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete,
            $"{SupabaseUrl}/rest/v1/lego_sets?user_id=eq.{userId}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", userJwt);
        var response = await http.SendAsync(request);
        if (!response.IsSuccessStatusCode) return (false, "Failed to delete sets.");
        return (true, "All sets removed from collection.");
    }

    public async Task<(bool Success, string? Error)> UpdateEmailAsync(string userJwt, string newEmail)
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, $"{SupabaseUrl}/auth/v1/user");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", userJwt);
        request.Content = JsonContent.Create(new { email = newEmail });

        var response = await http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            return (false, ExtractError(json, "Failed to update email."));
        }
        return (true, null);
    }

    private static string ExtractError(JsonElement json, string fallback)
    {
        if (json.TryGetProperty("error_description", out var d) && d.GetString() is string desc) return desc;
        if (json.TryGetProperty("message", out var m) && m.GetString() is string message) return message;
        if (json.TryGetProperty("msg", out var mg) && mg.GetString() is string msg) return msg;
        if (json.TryGetProperty("error", out var e) && e.GetString() is string err) return err;
        return $"{fallback}: {json.GetRawText()}";
    }
}
