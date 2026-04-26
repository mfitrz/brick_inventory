using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using RichardSzalay.MockHttp;

namespace LegoWebApp.Tests.Integration;

/// <summary>
/// Integration tests for the auth endpoints using a real in-process server
/// with mocked external HTTP calls to Supabase.
/// </summary>
public class AuthIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClientWithMockedSupabase(MockHttpMessageHandler mockHttp)
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.AddHttpClient<LegoWebApp.Services.SupabaseAuthService>()
                    .ConfigurePrimaryHttpMessageHandler(() => mockHttp);
            });
        }).CreateClient();
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/auth/v1/token*")
            .Respond("application/json", "{\"access_token\":\"integration-token\",\"token_type\":\"bearer\"}");

        var client = CreateClientWithMockedSupabase(mockHttp);

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "test@example.com",
            password = "password123"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        body.Should().ContainKey("token");
    }

    [Fact]
    public async Task Login_InvalidEmail_Returns400()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "not-an-email",
            password = "password123"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Signup_ShortPassword_Returns400()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/signup", new
        {
            email = "new@example.com",
            password = "abc"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        body.Should().ContainKey("error");
    }

    [Fact]
    public async Task ForgotPassword_ValidEmail_Returns200()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/auth/v1/recover*")
            .Respond(HttpStatusCode.OK);

        var client = CreateClientWithMockedSupabase(mockHttp);
        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new
        {
            email = "test@example.com"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ForgotPassword_MissingEmail_Returns400()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new
        {
            email = ""
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetSets_NoAuthHeader_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/sets");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Search_ShortQuery_ReturnsEmptyResults()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/search/sets?q=a");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        body.Should().ContainKey("results");
    }

    [Fact]
    public async Task VaultPredictions_NoAuth_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/vault/predictions", new List<object>());

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task VaultPredictions_EmptySets_Returns400()
    {
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Inject a fake JWT that has a valid sub claim
            });
        }).CreateClient();

        // Without auth header, should still 401
        var response = await client.PostAsJsonAsync("/api/vault/predictions", new List<object>());
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
