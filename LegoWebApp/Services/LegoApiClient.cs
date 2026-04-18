using System.Net.Http.Headers;
using System.Text.Json;
using LegoWebApp.Models;

namespace LegoWebApp.Services;

public class LegoApiClient(HttpClient http)
{
    public async Task<List<LegoSetDto>> GetSetsAsync(string jwt)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/sets");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        var response = await http.SendAsync(request);
        var sets = new List<LegoSetDto>();

        if (response.IsSuccessStatusCode)
        {
            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            foreach (var item in json.GetProperty("sets").EnumerateArray())
            {
                var setNumber = item.GetProperty("set_number").GetInt32();
                var name = item.GetProperty("name").GetString() ?? "";
                sets.Add(new LegoSetDto(setNumber, name));
            }
        }

        return sets;
    }

    public async Task<(bool Success, string Message)> AddSetAsync(string jwt, int setNumber, string setName)
    {
        var request = new HttpRequestMessage(HttpMethod.Post,
            $"/sets?set_number={setNumber}&set_name={Uri.EscapeDataString(setName)}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        var response = await http.SendAsync(request);

        if (response.StatusCode == System.Net.HttpStatusCode.Conflict)
            return (false, "This set is already in your collection.");
        if (!response.IsSuccessStatusCode)
            return (false, "Failed to add set.");

        return (true, "Set added to collection!");
    }

    public async Task<(bool Success, string Message)> DeleteSetAsync(string jwt, int setNumber)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, $"/sets?set_number={setNumber}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        var response = await http.SendAsync(request);

        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            return (false, "Set not found in your collection.");
        if (!response.IsSuccessStatusCode)
            return (false, "Failed to delete set.");

        return (true, "Set removed from collection.");
    }

    public async Task<(bool Success, string Message)> DeleteAllSetsAsync(string jwt)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, "/delete_sets");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        var response = await http.SendAsync(request);

        if (!response.IsSuccessStatusCode)
            return (false, "Failed to delete sets.");

        return (true, "All sets removed from collection.");
    }
}
