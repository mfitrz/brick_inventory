using System.Net.Http.Headers;
using System.Text.Json;
using LegoWebAppBlazor.Models;

namespace LegoWebAppBlazor.Services;

/// Calls your FastAPI backend for LEGO set CRUD operations.
/// Every method requires the JWT token for authentication.
public class LegoApiClient(HttpClient http)
{
    private readonly HttpClient _http = http;

    /// GET /sets — returns all LEGO sets for the authenticated user.
    public async Task<List<LegoSetDto>> GetSetsAsync(string jwt)
    {
       var request = new HttpRequestMessage(HttpMethod.Get, "/sets");
       // Add the JWT to the Authorization header
       request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

       var response = await _http.SendAsync(request);

       List<LegoSetDto> sets = [];
       if (response.IsSuccessStatusCode)
       {
           var json = await response.Content.ReadFromJsonAsync<JsonElement>();
           foreach (var item in json.GetProperty("sets").EnumerateArray())
           {
               int setNumber = item.GetProperty("set_number").GetInt32();
               string name = item.GetProperty("name").GetString() ?? "";
               sets.Add(new LegoSetDto(setNumber, name));
           }
       }

        return sets;
    }

    /// POST /sets — add a set to the collection.
    public async Task<(bool Success, string Message)> AddSetAsync(string jwt, int setNumber, string setName)
    {
        var request = new HttpRequestMessage(HttpMethod.Post,
            $"/sets?set_number={setNumber}&set_name={Uri.EscapeDataString(setName)}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        var response = await _http.SendAsync(request);

        if (response.StatusCode == System.Net.HttpStatusCode.Conflict)
            return (false, "This set is already in your collection.");

        if (!response.IsSuccessStatusCode)
            return (false, "Failed to add set.");

        return (true, "Set added to collection!");
    }

    /// DELETE /sets — remove one set from the collection.
    public async Task<(bool Success, string Message)> DeleteSetAsync(string jwt, int setNumber)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, $"/sets?set_number={setNumber}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        var response = await _http.SendAsync(request);

        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            return (false, "Set not found in your collection.");

        if (!response.IsSuccessStatusCode)
            return (false, "Failed to delete set.");

        return (true, "Set removed from collection.");
    }

    /// DELETE /delete_sets — remove ALL sets for this user.
    public async Task<(bool Success, string Message)> DeleteAllSetsAsync(string jwt)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, "/delete_sets");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        var response = await _http.SendAsync(request);

        if (!response.IsSuccessStatusCode)
            return (false, "Failed to delete sets.");

        return (true, "All sets removed from collection.");
    }
}
