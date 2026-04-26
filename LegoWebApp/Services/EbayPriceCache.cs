using System.Collections.Concurrent;

namespace LegoWebApp.Services;

public sealed class EbayPriceCache
{
    private record Entry(decimal? Price, DateTime Expires);
    private readonly ConcurrentDictionary<int, Entry> _cache = new();

    public bool TryGet(int setNumber, out decimal? price)
    {
        if (_cache.TryGetValue(setNumber, out var entry) && DateTime.UtcNow < entry.Expires)
        {
            price = entry.Price;
            return true;
        }
        price = default;
        return false;
    }

    public void Set(int setNumber, decimal? price) =>
        _cache[setNumber] = new Entry(price, DateTime.UtcNow.AddHours(24));
}
