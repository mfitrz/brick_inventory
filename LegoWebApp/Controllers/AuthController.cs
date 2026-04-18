using LegoWebApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LegoWebApp.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(SupabaseAuthService auth) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthRequest req)
    {
        var result = await auth.LoginAsync(req.Email, req.Password);
        if (!result.Success)
            return BadRequest(new { error = result.ErrorMessage });
        return Ok(new { token = result.Token });
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] AuthRequest req)
    {
        var result = await auth.SignUpAsync(req.Email, req.Password);
        if (!result.Success)
            return BadRequest(new { error = result.ErrorMessage });
        if (result.Token == null)
            return Ok(new { requiresConfirmation = true });
        return Ok(new { token = result.Token });
    }
}

public record AuthRequest(string Email, string Password);
