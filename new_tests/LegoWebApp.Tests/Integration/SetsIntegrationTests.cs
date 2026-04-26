using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using RichardSzalay.MockHttp;

namespace LegoWebApp.Tests.Integration;

/// <summary>
/// Integration tests for set CRUD endpoints.
/// Uses a valid JWT (non-expired, with sub claim) and mocked Supabase responses.
/// </summary>
public class SetsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    // JWT: { sub: "user-123", exp: 9999999999 }
    private const string ValidJwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
        ".eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OX0" +
        ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    public SetsIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {ValidJwt}");
        return client;
    }

    [Fact]
    public async Task GetSets_WithValidJwt_Returns200()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Get, "*/rest/v1/lego_sets*")
            .Respond("application/json", "[]");

        var client = _factory.WithWebHostBuilder(b =>
            b.ConfigureServices(s => s.AddHttpClient("SupabaseAuth")
                .ConfigurePrimaryHttpMessageHandler(() => mockHttp)))
            .CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {ValidJwt}");

        var response = await client.GetAsync("/api/sets");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task AddSet_ZeroSetNumber_Returns400()
    {
        var client = CreateAuthenticatedClient();
        var response = await client.PostAsync("/api/sets?set_number=0&set_name=Test", null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddSet_NegativeSetNumber_Returns400()
    {
        var client = CreateAuthenticatedClient();
        var response = await client.PostAsync("/api/sets?set_number=-1&set_name=Test", null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddSet_MissingSetName_Returns400()
    {
        var client = CreateAuthenticatedClient();
        var response = await client.PostAsync("/api/sets?set_number=75192&set_name=", null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddSet_InvalidYear_Returns400()
    {
        var client = CreateAuthenticatedClient();
        var response = await client.PostAsync("/api/sets?set_number=75192&set_name=Falcon&set_year=1900", null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteSet_ZeroSetNumber_Returns400()
    {
        var client = CreateAuthenticatedClient();
        var response = await client.DeleteAsync("/api/sets?set_number=0");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task LookupSet_NoAuth_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/sets/lookup?set_number=75192");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task LookupSet_InvalidSetNumber_Returns400()
    {
        var client = CreateAuthenticatedClient();
        var response = await client.GetAsync("/api/sets/lookup?set_number=0");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteAllSets_NoAuth_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.DeleteAsync("/api/sets/all");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
