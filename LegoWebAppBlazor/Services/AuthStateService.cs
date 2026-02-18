namespace LegoWebAppBlazor.Services;

/// Holds the JWT in memory for the current user's Blazor circuit.
/// Registered as Scoped — in Blazor Server, scoped = one instance per
/// SignalR connection = one per browser tab/user.
public class AuthStateService
{
    private string? _jwt;

    // Components subscribe to this event to re-render when auth state changes
    public event Action? OnChange;

    public string? GetJwt()
    {
        return _jwt;
    }

    public bool IsLoggedIn()
    {
        return _jwt != null;
    }

    public void Login(string jwt)
    {
        _jwt = jwt;
        OnChange?.Invoke();
    }

    public void Logout()
    {
        _jwt = null;
        OnChange?.Invoke();
    }
}
