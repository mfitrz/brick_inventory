using FluentAssertions;
using LegoWebApp.Controllers;
using LegoWebApp.Models;
using LegoWebApp.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace LegoWebApp.Tests.Unit.Controllers;

public class SetsControllerTests
{
    // Valid JWT: sub=user-123
    private const string ValidJwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
        ".eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OX0" +
        ".signature";

    private static SetsController CreateController(
        Mock<SupabaseAuthService>? authMock = null,
        Mock<EbayService>? ebayMock = null,
        Mock<RebrickableService>? rebrickableMock = null,
        string? authHeader = null)
    {
        authMock ??= new Mock<SupabaseAuthService>(new HttpClient());
        ebayMock ??= new Mock<EbayService>(
            new HttpClient(),
            Mock.Of<IConfiguration>(),
            Mock.Of<ILogger<EbayService>>(),
            new EbayTokenCache(),
            new EbayPriceCache());
        rebrickableMock ??= new Mock<RebrickableService>(new HttpClient(), Mock.Of<IConfiguration>());

        var controller = new SetsController(authMock.Object, ebayMock.Object, rebrickableMock.Object);
        var context = new DefaultHttpContext();
        if (authHeader != null)
            context.Request.Headers.Authorization = $"Bearer {authHeader}";
        controller.ControllerContext = new ControllerContext { HttpContext = context };
        return controller;
    }

    // ── GetSets ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetSets_NoAuthHeader_Returns401()
    {
        var controller = CreateController();
        var result = await controller.GetSets();

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task GetSets_ValidJwt_ReturnsSets()
    {
        var sets = new List<LegoSetDto> { new(75192, "Millennium Falcon", null, 499.99m, 2017) };
        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.GetAllSetsAsync(ValidJwt, "user-123")).ReturnsAsync(sets);

        var controller = CreateController(authMock, authHeader: ValidJwt);
        var result = await controller.GetSets();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new { sets });
    }

    // ── AddSet ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task AddSet_NoAuth_Returns401()
    {
        var controller = CreateController();
        var result = await controller.AddSet(75192, "Millennium Falcon", null);

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task AddSet_InvalidSetNumber_Returns400()
    {
        var controller = CreateController(authHeader: ValidJwt);
        var result = await controller.AddSet(0, "Some Set", null);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task AddSet_EmptySetName_Returns400()
    {
        var controller = CreateController(authHeader: ValidJwt);
        var result = await controller.AddSet(75192, "", null);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task AddSet_SetNameTooLong_Returns400()
    {
        var controller = CreateController(authHeader: ValidJwt);
        var result = await controller.AddSet(75192, new string('A', 201), null);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task AddSet_InvalidYear_Returns400()
    {
        var controller = CreateController(authHeader: ValidJwt);
        var result = await controller.AddSet(75192, "Falcon", null, 1900);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task AddSet_Success_Returns200WithEbayPrice()
    {
        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.AddSetAsync(ValidJwt, "user-123", 75192, "Falcon", null, 499.99m, 2017))
            .ReturnsAsync((true, "Set added to collection!"));

        var ebayMock = new Mock<EbayService>(
            new HttpClient(), Mock.Of<IConfiguration>(),
            Mock.Of<ILogger<EbayService>>(), new EbayTokenCache(), new EbayPriceCache());
        ebayMock.Setup(e => e.GetAverageSoldPriceAsync(75192)).ReturnsAsync(499.99m);

        var controller = CreateController(authMock, ebayMock, authHeader: ValidJwt);
        var result = await controller.AddSet(75192, "Falcon", null, 2017);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new { message = "Set added to collection!", ebayPrice = 499.99m });
    }

    [Fact]
    public async Task AddSet_DuplicateSet_Returns409()
    {
        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.AddSetAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(),
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<decimal?>(), It.IsAny<int?>()))
            .ReturnsAsync((false, "This set is already in your collection."));

        var ebayMock = new Mock<EbayService>(
            new HttpClient(), Mock.Of<IConfiguration>(),
            Mock.Of<ILogger<EbayService>>(), new EbayTokenCache(), new EbayPriceCache());
        ebayMock.Setup(e => e.GetAverageSoldPriceAsync(It.IsAny<int>())).ReturnsAsync((decimal?)null);

        var controller = CreateController(authMock, ebayMock, authHeader: ValidJwt);
        var result = await controller.AddSet(75192, "Falcon", null);

        result.Should().BeOfType<ConflictObjectResult>();
    }

    // ── DeleteSet ────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteSet_NoAuth_Returns401()
    {
        var controller = CreateController();
        var result = await controller.DeleteSet(75192);

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task DeleteSet_InvalidSetNumber_Returns400()
    {
        var controller = CreateController(authHeader: ValidJwt);
        var result = await controller.DeleteSet(-1);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task DeleteSet_Success_Returns200()
    {
        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.DeleteSetAsync(ValidJwt, "user-123", 75192))
            .ReturnsAsync((true, "Set removed from collection."));

        var controller = CreateController(authMock, authHeader: ValidJwt);
        var result = await controller.DeleteSet(75192);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteSet_NotFound_Returns404()
    {
        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.DeleteSetAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>()))
            .ReturnsAsync((false, "Set not found in your collection."));

        var controller = CreateController(authMock, authHeader: ValidJwt);
        var result = await controller.DeleteSet(99999);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ── DeleteAllSets ────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAllSets_NoAuth_Returns401()
    {
        var controller = CreateController();
        var result = await controller.DeleteAllSets();

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task DeleteAllSets_Success_Returns200()
    {
        var authMock = new Mock<SupabaseAuthService>(new HttpClient());
        authMock.Setup(s => s.DeleteAllSetsAsync(ValidJwt, "user-123"))
            .ReturnsAsync((true, "All sets removed from collection."));

        var controller = CreateController(authMock, authHeader: ValidJwt);
        var result = await controller.DeleteAllSets();

        result.Should().BeOfType<OkObjectResult>();
    }
}
