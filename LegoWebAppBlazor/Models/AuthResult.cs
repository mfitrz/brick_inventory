namespace LegoWebAppBlazor.Models;

// Represents the outcome of a login or signup attempt.
public class AuthResult
{
    public readonly bool Success;
    public readonly string? Token;
    public readonly string? ErrorMessage;

    public AuthResult(bool success, string? token, string? errorMessage)
    {
        this.Success = success;
        this.Token = token;
        this.ErrorMessage = errorMessage;
    }
}
