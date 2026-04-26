using System.Net;
using FluentAssertions;
using LegoWebApp.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using RichardSzalay.MockHttp;

namespace LegoWebApp.Tests.Unit.Services;

public class EbayServiceTests
{
    private static EbayService CreateService(MockHttpMessageHandler mockHttp, string? appId = "app-id", string? certId = "cert-id")
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Ebay:AppId"] = appId,
                ["Ebay:CertId"] = certId,
            })
            .Build();

        var logger = NullLogger<EbayService>.Instance;
        var tokenCache = new EbayTokenCache();
        var priceCache = new EbayPriceCache();
        return new EbayService(mockHttp.ToHttpClient(), config, logger, tokenCache, priceCache);
    }

    private static string TokenResponse(string token = "ebay-token", int expiresIn = 7200) =>
        $"{{\"access_token\":\"{token}\",\"expires_in\":{expiresIn}}}";

    private static string PriceResponse(params decimal[] prices)
    {
        var items = prices.Select(p =>
            $"{{\"price\":{{\"value\":\"{p:F2}\",\"currency\":\"USD\"}}}}");
        return $"{{\"total\":{prices.Length},\"itemSummaries\":[{string.Join(",", items)}]}}";
    }

    // ── Token fetching ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetAverageSoldPrice_MissingCredentials_ReturnsNull()
    {
        var mockHttp = new MockHttpMessageHandler();
        var service = CreateService(mockHttp, appId: null, certId: null);

        var result = await service.GetAverageSoldPriceAsync(75192);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetAverageSoldPrice_TokenRequestFails_ReturnsNull()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "https://api.ebay.com/identity/v1/oauth2/token")
            .Respond(HttpStatusCode.Unauthorized);

        var service = CreateService(mockHttp);
        var result = await service.GetAverageSoldPriceAsync(75192);

        result.Should().BeNull();
    }

    // ── Price parsing and IQR outlier removal ───────────────────────────────

    [Fact]
    public async Task GetAverageSoldPrice_NoPrices_ReturnsNull()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/oauth2/token")
            .Respond("application/json", TokenResponse());
        mockHttp
            .When(HttpMethod.Get, "*/item_summary/search*")
            .Respond("application/json", "{\"total\":0,\"itemSummaries\":[]}");

        var service = CreateService(mockHttp);
        var result = await service.GetAverageSoldPriceAsync(75192);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetAverageSoldPrice_NoItemSummariesKey_ReturnsNull()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/oauth2/token")
            .Respond("application/json", TokenResponse());
        mockHttp
            .When(HttpMethod.Get, "*/item_summary/search*")
            .Respond("application/json", "{\"total\":0}");

        var service = CreateService(mockHttp);
        var result = await service.GetAverageSoldPriceAsync(75192);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetAverageSoldPrice_SinglePrice_ReturnsThatPrice()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/oauth2/token")
            .Respond("application/json", TokenResponse());
        mockHttp
            .When(HttpMethod.Get, "*/item_summary/search*")
            .Respond("application/json", PriceResponse(100m));

        var service = CreateService(mockHttp);
        var result = await service.GetAverageSoldPriceAsync(75192);

        result.Should().Be(100m);
    }

    [Fact]
    public async Task GetAverageSoldPrice_UniformPrices_ReturnsAverage()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/oauth2/token")
            .Respond("application/json", TokenResponse());
        mockHttp
            .When(HttpMethod.Get, "*/item_summary/search*")
            .Respond("application/json", PriceResponse(100m, 100m, 100m, 100m));

        var service = CreateService(mockHttp);
        var result = await service.GetAverageSoldPriceAsync(75192);

        result.Should().Be(100m);
    }

    [Fact]
    public async Task GetAverageSoldPrice_WithOutliers_PrunesAndAverages()
    {
        // Clustered prices around 100, with extreme outliers at 1 and 10000
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/oauth2/token")
            .Respond("application/json", TokenResponse());
        mockHttp
            .When(HttpMethod.Get, "*/item_summary/search*")
            .Respond("application/json", PriceResponse(1m, 95m, 100m, 100m, 105m, 100m, 10000m));

        var service = CreateService(mockHttp);
        var result = await service.GetAverageSoldPriceAsync(75192);

        // Should be close to 100, not skewed by the outliers
        result.Should().BeGreaterThan(90m);
        result.Should().BeLessThan(120m);
    }

    [Fact]
    public async Task GetAverageSoldPrice_AllSameOutliers_ReturnsThemAnyway()
    {
        // When all prices are the same, IQR = 0, so lower/upper = same value
        // The filtered list would include them all
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/oauth2/token")
            .Respond("application/json", TokenResponse());
        mockHttp
            .When(HttpMethod.Get, "*/item_summary/search*")
            .Respond("application/json", PriceResponse(500m, 500m, 500m));

        var service = CreateService(mockHttp);
        var result = await service.GetAverageSoldPriceAsync(75192);

        result.Should().Be(500m);
    }

    [Fact]
    public async Task GetAverageSoldPrice_CachesResult()
    {
        var callCount = 0;
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/oauth2/token")
            .Respond("application/json", TokenResponse());
        mockHttp
            .When(HttpMethod.Get, "*/item_summary/search*")
            .Respond(() =>
            {
                callCount++;
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(PriceResponse(100m),
                        System.Text.Encoding.UTF8, "application/json")
                });
            });

        var service = CreateService(mockHttp);
        await service.GetAverageSoldPriceAsync(75192);
        await service.GetAverageSoldPriceAsync(75192);

        callCount.Should().Be(1);
    }

    [Fact]
    public async Task GetAverageSoldPrice_BrowseApiError_ReturnsNull()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/oauth2/token")
            .Respond("application/json", TokenResponse());
        mockHttp
            .When(HttpMethod.Get, "*/item_summary/search*")
            .Respond(HttpStatusCode.InternalServerError);

        var service = CreateService(mockHttp);
        var result = await service.GetAverageSoldPriceAsync(75192);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetAverageSoldPrice_SearchQueryContainsSetNumber()
    {
        var capturedUrl = string.Empty;
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/oauth2/token")
            .Respond("application/json", TokenResponse());
        mockHttp
            .When(HttpMethod.Get, "*/item_summary/search*")
            .Respond(r =>
            {
                capturedUrl = r.RequestUri?.ToString() ?? "";
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("{\"total\":0,\"itemSummaries\":[]}",
                        System.Text.Encoding.UTF8, "application/json")
                });
            });

        var service = CreateService(mockHttp);
        await service.GetAverageSoldPriceAsync(75192);

        capturedUrl.Should().Contain("75192");
        capturedUrl.Should().Contain("LEGO");
    }
}
