using LegoWebApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LegoWebApp.Controllers;

[Route("api/account")]
public class AccountController(
    SupabaseAdminService admin,
    SupabaseAuthService auth) : ApiControllerBase
{
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword()
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();

        var email = JwtHelper.DecodeClaim<string>(jwt, "email");
        if (string.IsNullOrEmpty(email))
            return BadRequest(new { message = "Could not resolve email from session." });

        var ok = await auth.SendPasswordResetAsync(email);
        if (!ok) return StatusCode(500, new { message = "Failed to send reset email." });

        return Ok(new { message = $"Password reset link sent to {email}." });
    }

    [HttpPost("change-email")]
    public async Task<IActionResult> ChangeEmail([FromBody] ChangeEmailRequest req)
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(req.NewEmail) || !IsValidEmail(req.NewEmail))
            return BadRequest(new { message = "A valid new email is required." });

        var (ok, error) = await auth.UpdateEmailAsync(jwt, req.NewEmail);
        if (!ok) return StatusCode(500, new { message = error ?? "Failed to update email." });

        return Ok(new { message = $"A confirmation link has been sent to {req.NewEmail}. Please verify to complete the change." });
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAccount()
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();

        var userId = JwtHelper.DecodeClaim<string>(jwt, "sub");
        if (string.IsNullOrEmpty(userId))
            return BadRequest(new { message = "Could not identify account." });

        await auth.DeleteAllSetsAsync(jwt, userId);

        var ok = await admin.DeleteUserAsync(userId);
        if (!ok) return StatusCode(500, new { message = "Failed to delete account. Please try again." });

        return Ok(new { message = "Account permanently deleted." });
    }
}

public record ChangeEmailRequest(string NewEmail);
