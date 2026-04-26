using System.Net;
using System.Text;
using FluentAssertions;
using LegoWebApp.Services;
using RichardSzalay.MockHttp;

namespace LegoWebApp.Tests.Unit.Services;

public class SupabaseAuthServiceTests
{
    private static SupabaseAuthService CreateService(MockHttpMessageHandler mockHttp)
        => new(mockHttp.ToHttpClient());

    // ── LoginAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsSuccessWithToken()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/auth/v1/token*")
            .Respond("application/json", "{\"access_token\":\"jwt-token-123\",\"token_type\":\"bearer\"}");

        var service = CreateService(mockHttp);
        var result = await service.LoginAsync("test@example.com", "password123");

        result.Success.Should().BeTrue();
        result.Token.Should().Be("jwt-token-123");
    }

    [Fact]
    public async Task LoginAsync_InvalidCredentials_ReturnsFailure()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/auth/v1/token*")
            .Respond(HttpStatusCode.BadRequest, "application/json",
                "{\"error\":\"invalid_grant\",\"error_description\":\"Invalid login credentials\"}");

        var service = CreateService(mockHttp);
        var result = await service.LoginAsync("test@example.com", "wrongpassword");

        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Be("Invalid login credentials");
    }

    [Fact]
    public async Task LoginAsync_SupabaseError_UsesErrorDescriptionField()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/auth/v1/token*")
            .Respond(HttpStatusCode.BadRequest, "application/json",
                "{\"error\":\"invalid_grant\",\"error_description\":\"Email not confirmed\"}");

        var service = CreateService(mockHttp);
        var result = await service.LoginAsync("unconfirmed@example.com", "password");

        result.ErrorMessage.Should().Be("Email not confirmed");
    }

    [Fact]
    public async Task LoginAsync_UnknownErrorShape_ReturnsFallbackMessage()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/auth/v1/token*")
            .Respond(HttpStatusCode.InternalServerError, "application/json", "{}");

        var service = CreateService(mockHttp);
        var result = await service.LoginAsync("test@example.com", "password");

        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().NotBeNullOrEmpty();
    }

    // ── SignUpAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task SignUpAsync_NewUser_ReturnsSuccessWithToken()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/auth/v1/signup*")
            .Respond("application/json",
                "{\"access_token\":\"new-user-token\",\"token_type\":\"bearer\"}");

        var service = CreateService(mockHttp);
        var result = await service.SignUpAsync("new@example.com", "password123");

        result.Success.Should().BeTrue();
        result.Token.Should().Be("new-user-token");
    }

    [Fact]
    public async Task SignUpAsync_RequiresEmailConfirmation_ReturnsSuccessWithNullToken()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/auth/v1/signup*")
            .Respond("application/json",
                "{\"id\":\"user-123\",\"email\":\"new@example.com\"}");

        var service = CreateService(mockHttp);
        var result = await service.SignUpAsync("new@example.com", "password123");

        result.Success.Should().BeTrue();
        result.Token.Should().BeNull();
    }

    [Fact]
    public async Task SignUpAsync_DuplicateEmail_ReturnsFailure()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/auth/v1/signup*")
            .Respond(HttpStatusCode.BadRequest, "application/json",
                "{\"msg\":\"User already registered\"}");

        var service = CreateService(mockHttp);
        var result = await service.SignUpAsync("existing@example.com", "password123");

        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Contain("already registered");
    }

    // ── SendPasswordResetAsync ───────────────────────────────────────────────

    [Fact]
    public async Task SendPasswordResetAsync_ValidEmail_ReturnsTrue()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/auth/v1/recover*")
            .Respond(HttpStatusCode.OK);

        var service = CreateService(mockHttp);
        var result = await service.SendPasswordResetAsync("test@example.com");

        result.Should().BeTrue();
    }

    [Fact]
    public async Task SendPasswordResetAsync_ApiError_ReturnsFalse()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Post, "*/auth/v1/recover*")
            .Respond(HttpStatusCode.InternalServerError);

        var service = CreateService(mockHttp);
        var result = await service.SendPasswordResetAsync("test@example.com");

        result.Should().BeFalse();
    }

    // ── GetAllSetsAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllSetsAsync_ReturnsMappedSets()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Get, "*/rest/v1/lego_sets*")
            .Respond("application/json", """
                [
                  {"set_number":75192,"name":"Millennium Falcon","img_url":"https://img.example.com/75192.jpg","ebay_price":499.99,"set_year":2017},
                  {"set_number":42115,"name":"Lamborghini Sian","img_url":null,"ebay_price":null,"set_year":2020}
                ]
                """);

        var service = CreateService(mockHttp);
        var sets = await service.GetAllSetsAsync("jwt-token", "user-123");

        sets.Should().HaveCount(2);
        sets[0].SetNumber.Should().Be(75192);
        sets[0].Name.Should().Be("Millennium Falcon");
        sets[0].CurrentPrice.Should().Be(499.99m);
        sets[1].CurrentPrice.Should().BeNull();
    }

    [Fact]
    public async Task GetAllSetsAsync_ApiError_ReturnsEmptyList()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Get, "*/rest/v1/lego_sets*")
            .Respond(HttpStatusCode.Unauthorized);

        var service = CreateService(mockHttp);
        var sets = await service.GetAllSetsAsync("bad-token", "user-123");

        sets.Should().BeEmpty();
    }

    // ── DeleteSetAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteSetAsync_Success_ReturnsTrue()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Delete, "*/rest/v1/lego_sets*")
            .Respond(r =>
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK);
                response.Content = new StringContent("");
                response.Content.Headers.TryAddWithoutValidation("Content-Range", "0-0/1");
                return response;
            });

        var service = CreateService(mockHttp);
        var (success, _) = await service.DeleteSetAsync("jwt", "user-123", 75192);

        success.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteSetAsync_SetNotFound_ReturnsFalse()
    {
        var mockHttp = new MockHttpMessageHandler();
        mockHttp
            .When(HttpMethod.Delete, "*/rest/v1/lego_sets*")
            .Respond(r =>
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK);
                response.Content = new StringContent("");
                response.Content.Headers.TryAddWithoutValidation("Content-Range", "*/0");
                return response;
            });

        var service = CreateService(mockHttp);
        var (success, message) = await service.DeleteSetAsync("jwt", "user-123", 99999);

        success.Should().BeFalse();
        message.Should().Contain("not found");
    }
}
