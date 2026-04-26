namespace LegoWebApp.Services;

public sealed class EbayTokenCache
{
    private readonly SemaphoreSlim _sem = new(1, 1);
    private string? _token;
    private DateTime _expiry = DateTime.MinValue;

    private bool IsValid => _token != null && DateTime.UtcNow < _expiry;

    public async Task<string?> GetOrRefreshAsync(Func<Task<(string Token, int ExpiresIn)?>> factory)
    {
        if (IsValid) return _token;

        await _sem.WaitAsync();
        try
        {
            if (IsValid) return _token;

            var result = await factory();
            if (result is null) return null;

            _token = result.Value.Token;
            _expiry = DateTime.UtcNow.AddSeconds(result.Value.ExpiresIn - 60);
            return _token;
        }
        finally
        {
            _sem.Release();
        }
    }
}
