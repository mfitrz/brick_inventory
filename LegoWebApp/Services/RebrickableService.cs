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
        var tokens = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var numberTokens = tokens.Where(t => System.Text.RegularExpressions.Regex.IsMatch(t, @"^\d+$")).ToList();
        var wordTokens = tokens.Where(t => !System.Text.RegularExpressions.Regex.IsMatch(t, @"^\d+$")).ToList();

        // Pure 4-digit year
        if (tokens.Length == 1 && numberTokens.Count == 1 &&
            int.TryParse(numberTokens[0], out var yr) && yr >= 1950 && yr <= 2030)
        {
            return await FetchSets($"&min_year={yr}&max_year={yr}", null, null);
        }

        // Mixed query: words + numbers — run text search and apply number filter on results
        if (wordTokens.Count > 0 && numberTokens.Count > 0)
        {
            var searchText = string.Join(" ", wordTokens);
            // Fetch more results so filtering has enough to work with
            var all = await FetchSets($"&search={Uri.EscapeDataString(searchText)}", pageSize: 50, minParts: null);
            return all
                .Where(s => numberTokens.Any(n =>
                    s.SetNum.Split('-')[0].StartsWith(n) ||
                    s.SetNum.Split('-')[0].Contains(n) ||
                    s.Year.ToString().StartsWith(n)))
                .Take(8).ToList();
        }

        // Pure text or pure number (non-year)
        return await FetchSets($"&search={Uri.EscapeDataString(trimmed)}", null, null);
    }

    private async Task<List<RebrickableSet>> FetchSets(string queryParams, int? pageSize, int? minParts)
    {
        var ps = pageSize ?? 8;
        var mp = minParts ?? 10;
        var url = $"https://rebrickable.com/api/v3/lego/sets/?key={ApiKey}&page_size={ps}&ordering=-year&min_parts={mp}{queryParams}";
        var response = await http.GetAsync(url);
        if (!response.IsSuccessStatusCode) return [];

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var results = new List<RebrickableSet>();
        foreach (var item in json.GetProperty("results").EnumerateArray())
        {
            var setNum = item.GetProperty("set_num").GetString() ?? "";
            if (!int.TryParse(setNum.Split('-')[0], out _)) continue;
            var name = item.GetProperty("name").GetString() ?? "";
            var year = item.GetProperty("year").GetInt32();
            var imgUrl = item.TryGetProperty("set_img_url", out var img) ? img.GetString() ?? "" : "";
            results.Add(new RebrickableSet(setNum, name, year, imgUrl));
        }
        return results;
    }
}
