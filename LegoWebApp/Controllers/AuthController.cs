using LegoWebApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LegoWebApp.Controllers;

[Route("api/auth")]
public class AuthController(SupabaseAuthService auth) : ApiControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthRequest req)
    {
        if (!IsValidEmail(req.Email))
            return BadRequest(new { error = "Invalid email address." });

        var result = await auth.LoginAsync(req.Email, req.Password);
        if (!result.Success)
            return BadRequest(new { error = result.ErrorMessage });
        return Ok(new { token = result.Token });
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] AuthRequest req)
    {
        if (!IsValidEmail(req.Email))
            return BadRequest(new { error = "Invalid email address." });
        if (string.IsNullOrEmpty(req.Password) || req.Password.Length < 6)
            return BadRequest(new { error = "Password must be at least 6 characters." });

        var result = await auth.SignUpAsync(req.Email, req.Password);
        if (!result.Success)
            return BadRequest(new { error = result.ErrorMessage });
        if (result.Token == null)
            return Ok(new { requiresConfirmation = true });
        return Ok(new { token = result.Token });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || !IsValidEmail(req.Email))
            return BadRequest(new { error = "Email is required." });

        // Always return success to avoid leaking whether an account exists
        await auth.SendPasswordResetAsync(req.Email);
        return Ok(new { message = "If an account exists, a reset link has been sent." });
    }
}

public record AuthRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
