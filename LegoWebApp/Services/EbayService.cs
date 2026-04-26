using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace LegoWebApp.Services;

public class EbayService(HttpClient http, IConfiguration config, ILogger<EbayService> logger, EbayTokenCache tokenCache, EbayPriceCache priceCache)
{
    private const string TokenUrl = "https://api.ebay.com/identity/v1/oauth2/token";
    private const string BrowseUrl = "https://api.ebay.com/buy/browse/v1/item_summary/search";

    public async Task<decimal?> GetAverageSoldPriceAsync(int setNumber)
    {
        if (priceCache.TryGet(setNumber, out var cached)) return cached;

        var token = await GetAccessTokenAsync();
        if (token == null) return null;

        var query = Uri.EscapeDataString($"LEGO {setNumber} set");
        var url = $"{BrowseUrl}?q={query}&category_ids=19006&limit=50";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Add("X-EBAY-C-MARKETPLACE-ID", "EBAY_US");

        try
        {
            var response = await http.SendAsync(request);
            var json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("eBay Browse API returned {StatusCode}: {Body}", (int)response.StatusCode, json);
                return null;
            }

            var result = ParseAveragePrice(json);
            priceCache.Set(setNumber, result);
            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "eBay Browse API request failed for set {SetNumber}", setNumber);
            return null;
        }
    }

    private Task<string?> GetAccessTokenAsync()
    {
        var appId = config["Ebay:AppId"];
        var certId = config["Ebay:CertId"];
        if (string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(certId))
            return Task.FromResult<string?>(null);

        return tokenCache.GetOrRefreshAsync(async () =>
        {
            var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{appId}:{certId}"));
            var request = new HttpRequestMessage(HttpMethod.Post, TokenUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["scope"] = "https://api.ebay.com/oauth/api_scope"
            });

            try
            {
                var response = await http.SendAsync(request);
                var json = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    logger.LogError("eBay token request failed {StatusCode}: {Body}", (int)response.StatusCode, json);
                    return null;
                }

                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                var token = root.GetProperty("access_token").GetString()!;
                var expiresIn = root.GetProperty("expires_in").GetInt32();
                return (token, expiresIn);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "eBay token request threw an exception");
                return null;
            }
        });
    }

    private decimal? ParseAveragePrice(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (!root.TryGetProperty("itemSummaries", out var items))
        {
            logger.LogWarning("eBay response has no itemSummaries. Keys: {Keys}",
                string.Join(", ", root.EnumerateObject().Select(p => p.Name)));
            return null;
        }

        var prices = new List<decimal>();
        foreach (var item in items.EnumerateArray())
        {
            if (!item.TryGetProperty("price", out var priceObj)) continue;
            if (!priceObj.TryGetProperty("value", out var valueEl)) continue;
            if (decimal.TryParse(valueEl.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var price))
                prices.Add(price);
        }

        logger.LogInformation("eBay returned {Count} prices: {Prices}", prices.Count, string.Join(", ", prices.Take(5)));

        if (prices.Count == 0) return null;

        return PruneOutliersAndAverage(prices);
    }

    private static decimal PruneOutliersAndAverage(List<decimal> prices)
    {
        prices.Sort();

        var q1 = Percentile(prices, 0.25);
        var q3 = Percentile(prices, 0.75);
        var iqr = q3 - q1;
        var lower = q1 - 1.5m * iqr;
        var upper = q3 + 1.5m * iqr;

        var filtered = prices.Where(p => p >= lower && p <= upper).ToList();
        if (filtered.Count == 0) filtered = prices;

        return Math.Round(filtered.Average(), 2);
    }

    private static decimal Percentile(List<decimal> sorted, double p)
    {
        var index = p * (sorted.Count - 1);
        var lo = (int)Math.Floor(index);
        var hi = (int)Math.Ceiling(index);
        if (lo == hi) return sorted[lo];
        return sorted[lo] + (decimal)(index - lo) * (sorted[hi] - sorted[lo]);
    }
}
