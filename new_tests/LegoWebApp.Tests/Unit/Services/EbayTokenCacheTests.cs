using FluentAssertions;
using LegoWebApp.Services;

namespace LegoWebApp.Tests.Unit.Services;

public class EbayTokenCacheTests
{
    private readonly EbayTokenCache _cache = new();

    [Fact]
    public async Task GetOrRefresh_FirstCall_InvokesFactory()
    {
        var callCount = 0;
        var result = await _cache.GetOrRefreshAsync(() =>
        {
            callCount++;
            return Task.FromResult<(string Token, int ExpiresIn)?>(("token-abc", 7200));
        });

        result.Should().Be("token-abc");
        callCount.Should().Be(1);
    }

    [Fact]
    public async Task GetOrRefresh_SubsequentCall_UsesCachedToken()
    {
        var callCount = 0;
        Func<Task<(string, int)?>> factory = () =>
        {
            callCount++;
            return Task.FromResult<(string, int)?>(("token-abc", 7200));
        };

        await _cache.GetOrRefreshAsync(factory);
        var result = await _cache.GetOrRefreshAsync(factory);

        result.Should().Be("token-abc");
        callCount.Should().Be(1);
    }

    [Fact]
    public async Task GetOrRefresh_FactoryReturnsNull_ReturnsNull()
    {
        var result = await _cache.GetOrRefreshAsync(() =>
            Task.FromResult<(string, int)?>(null));

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetOrRefresh_FactoryReturnsNull_DoesNotCache()
    {
        var callCount = 0;
        Func<Task<(string, int)?>> factory = () =>
        {
            callCount++;
            return Task.FromResult<(string, int)?>(null);
        };

        await _cache.GetOrRefreshAsync(factory);
        await _cache.GetOrRefreshAsync(factory);

        callCount.Should().Be(2);
    }

    [Fact]
    public async Task GetOrRefresh_ConcurrentCalls_OnlyInvokesFactoryOnce()
    {
        var callCount = 0;
        var barrier = new TaskCompletionSource();

        Func<Task<(string, int)?>> factory = async () =>
        {
            Interlocked.Increment(ref callCount);
            await Task.Delay(50);
            return ("token-concurrent", 7200);
        };

        var tasks = Enumerable.Range(0, 10).Select(_ => _cache.GetOrRefreshAsync(factory));
        var results = await Task.WhenAll(tasks);

        results.Should().AllBe("token-concurrent");
        callCount.Should().Be(1);
    }
}
