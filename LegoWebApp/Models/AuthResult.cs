namespace LegoWebApp.Models;

public class AuthResult
{
    public bool Success { get; }
    public string? Token { get; }
    public string? ErrorMessage { get; }

    private AuthResult(bool success, string? token, string? errorMessage)
    {
        Success = success;
        Token = token;
        ErrorMessage = errorMessage;
    }

    public static AuthResult Ok(string? token) => new(true, token, null);
    public static AuthResult Fail(string error) => new(false, null, error);
}
