using LegoWebApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LegoWebApp.Controllers;

[ApiController]
[Route("api/sets")]
public class SetsController(LegoApiClient api) : ControllerBase
{
    private string? GetJwt() =>
        Request.Headers.Authorization.FirstOrDefault()?.Replace("Bearer ", "");

    [HttpGet]
    public async Task<IActionResult> GetSets()
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();
        var sets = await api.GetSetsAsync(jwt);
        return Ok(new { sets });
    }

    [HttpPost]
    public async Task<IActionResult> AddSet([FromQuery] int set_number, [FromQuery] string set_name)
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();
        var (success, message) = await api.AddSetAsync(jwt, set_number, set_name);
        if (!success) return Conflict(new { message });
        return Ok(new { message });
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteSet([FromQuery] int set_number)
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();
        var (success, message) = await api.DeleteSetAsync(jwt, set_number);
        if (!success) return NotFound(new { message });
        return Ok(new { message });
    }

    [HttpDelete("all")]
    public async Task<IActionResult> DeleteAllSets()
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();
        var (success, message) = await api.DeleteAllSetsAsync(jwt);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }
}
