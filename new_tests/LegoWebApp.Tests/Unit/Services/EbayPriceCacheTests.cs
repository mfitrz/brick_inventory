using FluentAssertions;
using LegoWebApp.Services;

namespace LegoWebApp.Tests.Unit.Services;

public class EbayPriceCacheTests
{
    private readonly EbayPriceCache _cache = new();

    [Fact]
    public void TryGet_EmptyCache_ReturnsFalse()
    {
        var found = _cache.TryGet(75192, out var price);
        found.Should().BeFalse();
        price.Should().BeNull();
    }

    [Fact]
    public void Set_ThenTryGet_ReturnsPrice()
    {
        _cache.Set(75192, 499.99m);

        var found = _cache.TryGet(75192, out var price);
        found.Should().BeTrue();
        price.Should().Be(499.99m);
    }

    [Fact]
    public void Set_NullPrice_CachesNull()
    {
        _cache.Set(12345, null);

        var found = _cache.TryGet(12345, out var price);
        found.Should().BeTrue();
        price.Should().BeNull();
    }

    [Fact]
    public void Set_OverwritesExistingEntry()
    {
        _cache.Set(75192, 100m);
        _cache.Set(75192, 200m);

        _cache.TryGet(75192, out var price);
        price.Should().Be(200m);
    }

    [Fact]
    public void TryGet_DifferentSetNumbers_AreSeparate()
    {
        _cache.Set(75192, 100m);
        _cache.Set(42115, 200m);

        _cache.TryGet(75192, out var price1);
        _cache.TryGet(42115, out var price2);

        price1.Should().Be(100m);
        price2.Should().Be(200m);
    }

    [Fact]
    public void TryGet_UnknownSetNumber_ReturnsFalse()
    {
        _cache.Set(75192, 100m);

        var found = _cache.TryGet(99999, out _);
        found.Should().BeFalse();
    }
}
