using FluentAssertions;
using LegoWebApp.Controllers;
using LegoWebApp.Models;
using LegoWebApp.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace LegoWebApp.Tests.Unit.Controllers;

public class AuthControllerTests
{
    private static AuthController CreateController(Mock<SupabaseAuthService>? authMock = null)
    {
        authMock ??= new Mock<SupabaseAuthService>(new HttpClient());
        var controller = new AuthController(authMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        return controller;
    }

    // ── Login ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_ValidCredentials_Returns200WithToken()
    {
        var mock = new Mock<SupabaseAuthService>(new HttpClient());
        mock.Setup(s => s.LoginAsync("test@example.com", "password123"))
            .ReturnsAsync(AuthResult.Ok("jwt-token"));

        var controller = CreateController(mock);
        var result = await controller.Login(new AuthRequest("test@example.com", "password123"));

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new { token = "jwt-token" });
    }

    [Fact]
    public async Task Login_InvalidEmail_Returns400()
    {
        var controller = CreateController();
        var result = await controller.Login(new AuthRequest("not-an-email", "password"));

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Login_WrongPassword_Returns400WithError()
    {
        var mock = new Mock<SupabaseAuthService>(new HttpClient());
        mock.Setup(s => s.LoginAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(AuthResult.Fail("Invalid login credentials"));

        var controller = CreateController(mock);
        var result = await controller.Login(new AuthRequest("test@example.com", "wrong"));

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        bad.Value.Should().BeEquivalentTo(new { error = "Invalid login credentials" });
    }

    [Fact]
    public async Task Login_EmptyEmail_Returns400()
    {
        var controller = CreateController();
        var result = await controller.Login(new AuthRequest("", "password"));

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── Signup ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Signup_ValidUser_Returns200WithToken()
    {
        var mock = new Mock<SupabaseAuthService>(new HttpClient());
        mock.Setup(s => s.SignUpAsync("new@example.com", "password123"))
            .ReturnsAsync(AuthResult.Ok("new-token"));

        var controller = CreateController(mock);
        var result = await controller.Signup(new AuthRequest("new@example.com", "password123"));

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new { token = "new-token" });
    }

    [Fact]
    public async Task Signup_RequiresConfirmation_Returns200WithFlag()
    {
        var mock = new Mock<SupabaseAuthService>(new HttpClient());
        mock.Setup(s => s.SignUpAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(AuthResult.Ok(null));

        var controller = CreateController(mock);
        var result = await controller.Signup(new AuthRequest("new@example.com", "password123"));

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new { requiresConfirmation = true });
    }

    [Fact]
    public async Task Signup_ShortPassword_Returns400()
    {
        var controller = CreateController();
        var result = await controller.Signup(new AuthRequest("test@example.com", "abc"));

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Signup_InvalidEmail_Returns400()
    {
        var controller = CreateController();
        var result = await controller.Signup(new AuthRequest("bad-email", "password123"));

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── ForgotPassword ───────────────────────────────────────────────────────

    [Fact]
    public async Task ForgotPassword_ValidEmail_Returns200()
    {
        var mock = new Mock<SupabaseAuthService>(new HttpClient());
        mock.Setup(s => s.SendPasswordResetAsync(It.IsAny<string>())).ReturnsAsync(true);

        var controller = CreateController(mock);
        var result = await controller.ForgotPassword(new ForgotPasswordRequest("test@example.com"));

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task ForgotPassword_InvalidEmail_Returns400()
    {
        var controller = CreateController();
        var result = await controller.ForgotPassword(new ForgotPasswordRequest("not-email"));

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ForgotPassword_AlwaysReturnsSuccess_EvenIfEmailNotFound()
    {
        // Security: never reveal whether an email exists
        var mock = new Mock<SupabaseAuthService>(new HttpClient());
        mock.Setup(s => s.SendPasswordResetAsync(It.IsAny<string>())).ReturnsAsync(false);

        var controller = CreateController(mock);
        var result = await controller.ForgotPassword(new ForgotPasswordRequest("unknown@example.com"));

        result.Should().BeOfType<OkObjectResult>();
    }
}
