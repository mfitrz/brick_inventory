using System.Text.Json;
using LegoWebApp.Models;

namespace LegoWebApp.Services;

public class ClaudePredictionService(HttpClient http, IConfiguration config, ILogger<ClaudePredictionService> logger)
{
    public async Task<VaultPrediction?> PredictAsync(List<SetValueItem> sets)
    {
        var apiKey = config["Anthropic:ApiKey"];
        if (string.IsNullOrEmpty(apiKey)) return null;

        var currentYear = DateTime.UtcNow.Year;
        var currentTotal = sets.Sum(s => s.CurrentPrice);
        var setsList = string.Join("\n", sets.Select(s => $"- Set {s.SetNumber} ({s.Name}): ${s.CurrentPrice:F2}"));

        var prompt = $$"""
            You are a LEGO set market analyst. Given a collection of LEGO sets, predict the total collection value for each of the next 5 years.

            Factors to consider:
            - Retired LEGO sets historically appreciate 10-15% annually
            - Sets still in production appreciate 2-5% annually
            - Iconic themes (Star Wars UCS, Icons, Technic flagship) appreciate faster
            - Larger, more complex sets tend to hold value better
            - Sets listed at $0.00 have no eBay data available — estimate their current market value based on the set name and number before projecting forward

            Current year: {{currentYear}}
            Current total collection value (eBay-priced sets only): ${{currentTotal:F2}}

            Collection (sets at $0.00 need their value estimated):
            {{setsList}}

            Respond with ONLY valid JSON, no explanation, no markdown:
            {"predictions":[{"year":{{currentYear + 1}},"totalValue":0.0},{"year":{{currentYear + 2}},"totalValue":0.0},{"year":{{currentYear + 3}},"totalValue":0.0},{"year":{{currentYear + 4}},"totalValue":0.0},{"year":{{currentYear + 5}},"totalValue":0.0}]}
            """;

        const string model = "claude-haiku-4-5-20251001";

        var requestBody = new
        {
            model,
            max_tokens = 256,
            messages = new[] { new { role = "user", content = prompt } }
        };

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var bodyJson = JsonSerializer.Serialize(requestBody, jsonOptions);

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
        {
            Content = new StringContent(bodyJson, System.Text.Encoding.UTF8, "application/json")
        };
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");

        try
        {
            var response = await http.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Claude API returned {StatusCode}", (int)response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var text = doc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrEmpty(text)) return null;

            var cleanText = text.Trim();
            if (cleanText.StartsWith("```")) cleanText = cleanText.Split('\n', 2)[1];
            if (cleanText.EndsWith("```")) cleanText = cleanText[..cleanText.LastIndexOf("```")].TrimEnd();

            using var predDoc = JsonDocument.Parse(cleanText.Trim());
            var predictions = predDoc.RootElement
                .GetProperty("predictions")
                .EnumerateArray()
                .Select(p => new YearPrediction(
                    p.GetProperty("year").GetInt32(),
                    Math.Round(p.GetProperty("totalValue").GetDecimal(), 2)
                ))
                .ToList();

            return new VaultPrediction(Math.Round(currentTotal, 2), predictions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Claude prediction failed");
            return null;
        }
    }
}
