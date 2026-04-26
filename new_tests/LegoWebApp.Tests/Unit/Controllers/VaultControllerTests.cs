using FluentAssertions;
using LegoWebApp.Controllers;
using LegoWebApp.Models;
using LegoWebApp.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace LegoWebApp.Tests.Unit.Controllers;

public class VaultControllerTests
{
    // JWT: { sub: "user-123", exp: 9999999999 }
    private const string ValidJwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
        ".eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OX0" +
        ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    private static readonly List<SetValueItem> SampleSets =
    [
        new(75192, "Millennium Falcon", 499.99m),
        new(42115, "Lamborghini Sian", 249.99m),
    ];

    private static VaultController CreateController(
        Mock<ClaudePredictionService>? claudeMock = null,
        string? authHeader = null)
    {
        claudeMock ??= new Mock<ClaudePredictionService>(
            new HttpClient(),
            new ConfigurationBuilder().Build(),
            NullLogger<ClaudePredictionService>.Instance);

        var controller = new VaultController(claudeMock.Object);
        var context = new DefaultHttpContext();
        if (authHeader != null)
            context.Request.Headers.Authorization = $"Bearer {authHeader}";
        controller.ControllerContext = new ControllerContext { HttpContext = context };
        return controller;
    }

    // ── Auth guard ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPredictions_NoAuth_Returns401()
    {
        var controller = CreateController();
        var result = await controller.GetPredictions(SampleSets);

        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ── Input validation ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetPredictions_NullBody_Returns400()
    {
        var controller = CreateController(authHeader: ValidJwt);
        var result = await controller.GetPredictions(null!);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        bad.Value.Should().BeEquivalentTo(new { message = "No sets provided" });
    }

    [Fact]
    public async Task GetPredictions_EmptyList_Returns400()
    {
        var controller = CreateController(authHeader: ValidJwt);
        var result = await controller.GetPredictions([]);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        bad.Value.Should().BeEquivalentTo(new { message = "No sets provided" });
    }

    // ── Claude service unavailable ───────────────────────────────────────────

    [Fact]
    public async Task GetPredictions_ClaudeReturnsNull_Returns503()
    {
        var claudeMock = new Mock<ClaudePredictionService>(
            new HttpClient(),
            new ConfigurationBuilder().Build(),
            NullLogger<ClaudePredictionService>.Instance);
        claudeMock.Setup(s => s.PredictAsync(It.IsAny<List<SetValueItem>>()))
            .ReturnsAsync((VaultPrediction?)null);

        var controller = CreateController(claudeMock, authHeader: ValidJwt);
        var result = await controller.GetPredictions(SampleSets);

        var obj = result.Should().BeOfType<ObjectResult>().Subject;
        obj.StatusCode.Should().Be(503);
        obj.Value.Should().BeEquivalentTo(new { message = "Prediction unavailable" });
    }

    // ── Success ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPredictions_ValidRequest_Returns200WithPrediction()
    {
        var currentYear = DateTime.UtcNow.Year;
        var prediction = new VaultPrediction(749.98m,
        [
            new YearPrediction(currentYear + 1, 824.98m),
            new YearPrediction(currentYear + 2, 907.48m),
            new YearPrediction(currentYear + 3, 998.23m),
            new YearPrediction(currentYear + 4, 1098.05m),
            new YearPrediction(currentYear + 5, 1207.86m),
        ]);

        var claudeMock = new Mock<ClaudePredictionService>(
            new HttpClient(),
            new ConfigurationBuilder().Build(),
            NullLogger<ClaudePredictionService>.Instance);
        claudeMock.Setup(s => s.PredictAsync(It.IsAny<List<SetValueItem>>()))
            .ReturnsAsync(prediction);

        var controller = CreateController(claudeMock, authHeader: ValidJwt);
        var result = await controller.GetPredictions(SampleSets);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var value = ok.Value.Should().BeAssignableTo<VaultPrediction>().Subject;
        value.CurrentTotal.Should().Be(749.98m);
        value.Predictions.Should().HaveCount(5);
        value.Predictions[0].Year.Should().Be(currentYear + 1);
    }

    [Fact]
    public async Task GetPredictions_PassesSetsToClaudeService()
    {
        List<SetValueItem>? capturedSets = null;

        var claudeMock = new Mock<ClaudePredictionService>(
            new HttpClient(),
            new ConfigurationBuilder().Build(),
            NullLogger<ClaudePredictionService>.Instance);
        claudeMock.Setup(s => s.PredictAsync(It.IsAny<List<SetValueItem>>()))
            .Callback<List<SetValueItem>>(sets => capturedSets = sets)
            .ReturnsAsync(new VaultPrediction(0m, []));

        var controller = CreateController(claudeMock, authHeader: ValidJwt);
        await controller.GetPredictions(SampleSets);

        capturedSets.Should().BeEquivalentTo(SampleSets);
    }

    [Fact]
    public async Task GetPredictions_SingleSet_Returns200()
    {
        var claudeMock = new Mock<ClaudePredictionService>(
            new HttpClient(),
            new ConfigurationBuilder().Build(),
            NullLogger<ClaudePredictionService>.Instance);
        claudeMock.Setup(s => s.PredictAsync(It.IsAny<List<SetValueItem>>()))
            .ReturnsAsync(new VaultPrediction(99.99m, []));

        var controller = CreateController(claudeMock, authHeader: ValidJwt);
        var result = await controller.GetPredictions([new(75192, "Millennium Falcon", 99.99m)]);

        result.Should().BeOfType<OkObjectResult>();
    }
}
