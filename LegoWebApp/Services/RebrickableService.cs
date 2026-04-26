using System.Text.Json;

namespace LegoWebApp.Services;

public record RebrickableSet(string SetNum, string Name, int Year, string ImgUrl);

public class RebrickableService(HttpClient http, IConfiguration config)
{
    private string ApiKey => config["Rebrickable:ApiKey"] ?? "";

    public async Task<RebrickableSet?> GetSetByNumberAsync(int setNumber)
    {
        // Try variants -1 through -3; most sets are -1 but some (e.g. promotional sets) differ
        foreach (var variant in new[] { 1, 2, 3 })
        {
            var response = await http.GetAsync(
                $"https://rebrickable.com/api/v3/lego/sets/{setNumber}-{variant}/?key={ApiKey}");
            if (!response.IsSuccessStatusCode) continue;

            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            var setNum = json.GetProperty("set_num").GetString() ?? "";
            var name = json.GetProperty("name").GetString() ?? "";
            var year = json.GetProperty("year").GetInt32();
            var imgUrl = json.TryGetProperty("set_img_url", out var img) ? img.GetString() ?? "" : "";
            return new RebrickableSet(setNum, name, year, imgUrl);
        }

        // Fall back to text search by set number
        var searchResp = await http.GetAsync(
            $"https://rebrickable.com/api/v3/lego/sets/?key={ApiKey}&search={setNumber}&page_size=5");
        if (!searchResp.IsSuccessStatusCode) return null;

        var searchJson = await searchResp.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var item in searchJson.GetProperty("results").EnumerateArray())
        {
            var rawNum = item.GetProperty("set_num").GetString() ?? "";
            if (rawNum.Split('-')[0] == setNumber.ToString())
            {
                var name = item.GetProperty("name").GetString() ?? "";
                var year = item.GetProperty("year").GetInt32();
                var imgUrl = item.TryGetProperty("set_img_url", out var img) ? img.GetString() ?? "" : "";
                return new RebrickableSet(rawNum, name, year, imgUrl);
            }
        }

        return null;
    }

    public async Task<List<RebrickableSet>> SearchSetsAsync(string query)
    {
        var trimmed = query.Trim();
        var urlBuilder = new System.Text.StringBuilder(
            $"https://rebrickable.com/api/v3/lego/sets/?key={ApiKey}&page_size=8&ordering=-year&min_parts=10");

        // If the query is a 4-digit year, filter by year instead of text search
        if (System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"^\d{4}$") &&
            int.TryParse(trimmed, out var yr) && yr >= 1950 && yr <= 2030)
        {
            urlBuilder.Append($"&min_year={yr}&max_year={yr}");
        }
        else
        {
            urlBuilder.Append($"&search={Uri.EscapeDataString(trimmed)}");
        }

        var response = await http.GetAsync(urlBuilder.ToString());
        if (!response.IsSuccessStatusCode) return [];

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var results = new List<RebrickableSet>();
        foreach (var item in json.GetProperty("results").EnumerateArray())
        {
            var setNum = item.GetProperty("set_num").GetString() ?? "";
            // Skip sets whose number (before the dash) isn't a valid integer
            var numPart = setNum.Split('-')[0];
            if (!int.TryParse(numPart, out _)) continue;

            var name = item.GetProperty("name").GetString() ?? "";
            var year = item.GetProperty("year").GetInt32();
            var imgUrl = item.TryGetProperty("set_img_url", out var img) ? img.GetString() ?? "" : "";
            results.Add(new RebrickableSet(setNum, name, year, imgUrl));
        }
        return results;
    }
}
