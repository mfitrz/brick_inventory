using System.Net;
using FluentAssertions;
using LegoWebApp.Services;
using Microsoft.Extensions.Configuration;
using RichardSzalay.MockHttp;

namespace LegoWebApp.Tests.Unit.Services;

public class RebrickableServiceTests
{
    private const string ApiKey = "test-api-key";

    private static RebrickableService CreateService(MockHttpMessageHandler mockHttp)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Rebrickable:ApiKey"] = ApiKey })
            .Build();
        var client = mockHttp.ToHttpClient();
        return new RebrickableService(client, config);
    }

    private static string SetListJson(params (string setNum, string name, int year)[] sets)
    {
        var items = sets.Select(s =>
            $"{{\"set_num\":\"{s.setNum}\",\"name\":\"{s.name}\",\"year\":{s.year},\"set_img_url\":\"https://img.example.com/{s.setNum}.jpg\"}}");
        return $"{{\"count\":{sets.Length},\"results\":[{string.Join(",", items)}]}}";
    }

    // ── SearchSetsAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task SearchSetsAsync_TextOnlyQuery_CallsSearchEndpoint()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When("https://rebrickable.com/api/v3/lego/sets/*")
            .Respond("application/json", SetListJson(("75192-1", "Millennium Falcon", 2017)));

        var service = CreateService(mockHttp);
        var results = await service.SearchSetsAsync("falcon");

        results.Should().HaveCount(1);
        results[0].Name.Should().Be("Millennium Falcon");
        results[0].Year.Should().Be(2017);
    }

    [Fact]
    public async Task SearchSetsAsync_PureYearQuery_UsesYearFilter()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When("https://rebrickable.com/api/v3/lego/sets/*")
            .Respond("application/json", SetListJson(("75257-1", "Millennium Falcon", 2019)));

        var service = CreateService(mockHttp);
        var results = await service.SearchSetsAsync("2019");

        results.Should().HaveCount(1);
        results[0].Year.Should().Be(2019);
    }

    [Fact]
    public async Task SearchSetsAsync_PureYear_OutOfRange_UsesSearchInstead()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When("https://rebrickable.com/api/v3/lego/sets/*")
            .Respond("application/json", SetListJson());

        var service = CreateService(mockHttp);
        var results = await service.SearchSetsAsync("1800");

        results.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchSetsAsync_MixedQuery_FiltersResultsByNumber()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When("https://rebrickable.com/api/v3/lego/sets/*")
            .Respond("application/json", SetListJson(
                ("75192-1", "Millennium Falcon", 2017),
                ("75257-1", "Millennium Falcon", 2019),
                ("75212-1", "Kessel Run Falcon", 2018)
            ));

        var service = CreateService(mockHttp);
        var results = await service.SearchSetsAsync("falcon 2019");

        results.Should().HaveCount(1);
        results[0].SetNum.Should().Be("75257-1");
    }

    [Fact]
    public async Task SearchSetsAsync_MixedQuery_MatchesSetNumberPrefix()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When("https://rebrickable.com/api/v3/lego/sets/*")
            .Respond("application/json", SetListJson(
                ("75192-1", "Millennium Falcon", 2017),
                ("75257-1", "Millennium Falcon", 2019)
            ));

        var service = CreateService(mockHttp);
        var results = await service.SearchSetsAsync("falcon 75");

        results.Should().HaveCount(2);
    }

    [Fact]
    public async Task SearchSetsAsync_ApiError_ReturnsEmptyList()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When("https://rebrickable.com/api/v3/lego/sets/*")
            .Respond(HttpStatusCode.Unauthorized);

        var service = CreateService(mockHttp);
        var results = await service.SearchSetsAsync("falcon");

        results.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchSetsAsync_FiltersNonNumericSetNumbers()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When("https://rebrickable.com/api/v3/lego/sets/*")
            .Respond("application/json", SetListJson(
                ("75192-1", "Millennium Falcon", 2017),
                ("CELEB2015M-1", "Mini Millennium Falcon", 2015)
            ));

        var service = CreateService(mockHttp);
        var results = await service.SearchSetsAsync("falcon");

        results.Should().HaveCount(1);
        results[0].SetNum.Should().Be("75192-1");
    }

    [Fact]
    public async Task SearchSetsAsync_LimitsTo8Results()
    {
        var sets = Enumerable.Range(1, 8)
            .Select(i => ($"{10000 + i}-1", $"Set {i}", 2020))
            .ToArray();

        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When("https://rebrickable.com/api/v3/lego/sets/*")
            .Respond("application/json", SetListJson(sets));

        var service = CreateService(mockHttp);
        var results = await service.SearchSetsAsync("set");

        results.Should().HaveCountLessOrEqualTo(8);
    }

    // ── GetSetByNumberAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task GetSetByNumberAsync_ValidSetNumber_ReturnsSet()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When("https://rebrickable.com/api/v3/lego/sets/75192-1/*")
            .Respond("application/json",
                "{\"set_num\":\"75192-1\",\"name\":\"Millennium Falcon\",\"year\":2017,\"set_img_url\":\"https://img.example.com/75192.jpg\"}");

        var service = CreateService(mockHttp);
        var result = await service.GetSetByNumberAsync(75192);

        result.Should().NotBeNull();
        result!.Name.Should().Be("Millennium Falcon");
        result.Year.Should().Be(2017);
    }

    [Fact]
    public async Task GetSetByNumberAsync_SetNotFound_ReturnsNull()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When("https://rebrickable.com/api/v3/lego/sets/*")
            .Respond(HttpStatusCode.NotFound);

        var service = CreateService(mockHttp);
        var result = await service.GetSetByNumberAsync(99999);

        result.Should().BeNull();
    }
}
