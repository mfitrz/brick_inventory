using FluentAssertions;
using LegoWebApp.Controllers;
using LegoWebApp.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;

namespace LegoWebApp.Tests.Unit.Controllers;

public class SearchControllerTests
{
    private static SearchController CreateController(Mock<RebrickableService>? mock = null)
    {
        mock ??= new Mock<RebrickableService>(new HttpClient(), Mock.Of<IConfiguration>());
        var controller = new SearchController(mock.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        return controller;
    }

    [Fact]
    public async Task SearchSets_EmptyQuery_ReturnsEmptyResults()
    {
        var controller = CreateController();
        var result = await controller.SearchSets("");

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new { results = Array.Empty<object>() });
    }

    [Fact]
    public async Task SearchSets_SingleCharQuery_ReturnsEmptyResults()
    {
        var controller = CreateController();
        var result = await controller.SearchSets("a");

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new { results = Array.Empty<object>() });
    }

    [Fact]
    public async Task SearchSets_ValidQuery_ReturnsResults()
    {
        var sets = new List<RebrickableSet>
        {
            new("75192-1", "Millennium Falcon", 2017, "https://img.example.com/75192.jpg")
        };

        var mock = new Mock<RebrickableService>(new HttpClient(), Mock.Of<IConfiguration>());
        mock.Setup(s => s.SearchSetsAsync("falcon")).ReturnsAsync(sets);

        var controller = CreateController(mock);
        var result = await controller.SearchSets("falcon");

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new { results = sets });
    }

    [Fact]
    public async Task SearchSets_QueryTooLong_Returns400()
    {
        var controller = CreateController();
        var result = await controller.SearchSets(new string('a', 101));

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task SearchSets_NullQuery_ReturnsEmptyResults()
    {
        var controller = CreateController();
        var result = await controller.SearchSets(null!);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new { results = Array.Empty<object>() });
    }
}
