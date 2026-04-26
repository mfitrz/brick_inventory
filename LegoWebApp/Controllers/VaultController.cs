using LegoWebApp.Models;
using LegoWebApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LegoWebApp.Controllers;

[Route("api/vault")]
public class VaultController(ClaudePredictionService claude) : ApiControllerBase
{
    [HttpPost("predictions")]
    public async Task<IActionResult> GetPredictions([FromBody] List<SetValueItem> sets)
    {
        if (GetJwt() == null) return Unauthorized();
        if (sets == null || sets.Count == 0) return BadRequest(new { message = "No sets provided" });

        var result = await claude.PredictAsync(sets);
        if (result == null) return StatusCode(503, new { message = "Prediction unavailable" });

        return Ok(result);
    }
}
