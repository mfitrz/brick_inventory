using FluentAssertions;
using LegoWebApp.Controllers;
using LegoWebApp.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace LegoWebApp.Tests.Unit.Controllers;

public class AccountControllerTests
{
    // JWT: { sub: "user-123", exp: 9999999999 }
    private const string ValidJwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
        ".eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OX0" +
        ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    // JWT: { sub: "user-123", email: "test@example.com", exp: 9999999999 }
    private const string ValidJwtWithEmail =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
        ".eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OX0" +
        ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    // AccountController(SupabaseAdminService admin, SupabaseAuthService auth)
    private static AccountController CreateController(
        Mock<SupabaseAdminService>? adminMock = null,
        Mock<SupabaseAuthService>? authMock = null,
        string? authHeader = null)
    {
        adminMock ??= new Mock<SupabaseAdminService>(new HttpClient());
        authMock ??= new Mock<SupabaseAuthService>(new HttpClient());

        var controller = new AccountController(adminMock.Object, authMock.Object);
        var context = new DefaultHttpContext();
        if (authHeader != null)
            context.Request.Headers.Authorization = $"Bearer {authHeader}";
        controller.ControllerContext = new ControllerContext { HttpContext = context };
        return controller;
    }

    // ── ResetPassword ────────────────────────────────────────────────────────

    [Fact]
    public async Task ResetPassword_NoAuth_Returns401()
    {
        var controller = CreateController();
        var result = await controller.ResetPassword();

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task ResetPassword_NoEmailClaim_Returns400()
    {
        // ValidJwt has no email claim — controller returns 400
        var controller = CreateController(authHeader: ValidJwt);
        var result = await controller.ResetPassword();

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ResetPassword_ValidAuth_Returns200()
    {
        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.SendPasswordResetAsync("test@example.com")).ReturnsAsync(true);

        var controller = CreateController(authMock: authMock, authHeader: ValidJwtWithEmail);
        var result = await controller.ResetPassword();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task ResetPassword_SendFails_Returns500()
    {
        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.SendPasswordResetAsync(It.IsAny<string>())).ReturnsAsync(false);

        var controller = CreateController(authMock: authMock, authHeader: ValidJwtWithEmail);
        var result = await controller.ResetPassword();

        result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(500);
    }

    // ── ChangeEmail ──────────────────────────────────────────────────────────

    [Fact]
    public async Task ChangeEmail_NoAuth_Returns401()
    {
        var controller = CreateController();
        var result = await controller.ChangeEmail(new ChangeEmailRequest("new@example.com"));

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task ChangeEmail_ValidEmail_Returns200()
    {
        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.UpdateEmailAsync(ValidJwt, "new@example.com"))
            .ReturnsAsync((true, (string?)null));

        var controller = CreateController(authMock: authMock, authHeader: ValidJwt);
        var result = await controller.ChangeEmail(new ChangeEmailRequest("new@example.com"));

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task ChangeEmail_InvalidEmail_Returns400()
    {
        var controller = CreateController(authHeader: ValidJwt);
        var result = await controller.ChangeEmail(new ChangeEmailRequest("not-an-email"));

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ChangeEmail_EmptyEmail_Returns400()
    {
        var controller = CreateController(authHeader: ValidJwt);
        var result = await controller.ChangeEmail(new ChangeEmailRequest(""));

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ChangeEmail_ServiceError_Returns500WithMessage()
    {
        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.UpdateEmailAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((false, "Email already in use."));

        var controller = CreateController(authMock: authMock, authHeader: ValidJwt);
        var result = await controller.ChangeEmail(new ChangeEmailRequest("taken@example.com"));

        var obj = result.Should().BeOfType<ObjectResult>().Subject;
        obj.StatusCode.Should().Be(500);
        obj.Value.Should().BeEquivalentTo(new { message = "Email already in use." });
    }

    // ── DeleteAccount ────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAccount_NoAuth_Returns401()
    {
        var controller = CreateController();
        var result = await controller.DeleteAccount();

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task DeleteAccount_ValidAuth_Returns200()
    {
        var adminMock = new Mock<SupabaseAdminService>(new HttpClient());
        adminMock.Setup(s => s.DeleteUserAsync("user-123")).ReturnsAsync(true);

        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.DeleteAllSetsAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((true, "All removed."));

        var controller = CreateController(adminMock: adminMock, authMock: authMock, authHeader: ValidJwt);
        var result = await controller.DeleteAccount();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteAccount_AdminDeleteFails_Returns500()
    {
        var adminMock = new Mock<SupabaseAdminService>(new HttpClient());
        adminMock.Setup(s => s.DeleteUserAsync(It.IsAny<string>())).ReturnsAsync(false);

        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.DeleteAllSetsAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((true, "All removed."));

        var controller = CreateController(adminMock: adminMock, authMock: authMock, authHeader: ValidJwt);
        var result = await controller.DeleteAccount();

        result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(500);
    }
}
