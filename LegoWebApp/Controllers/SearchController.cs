using LegoWebApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LegoWebApp.Controllers;

[Route("api/search")]
public class SearchController(RebrickableService rebrickable) : ApiControllerBase
{
    private const int MaxQueryLength = 100;

    [HttpGet("sets")]
    public async Task<IActionResult> SearchSets([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(new { results = Array.Empty<object>() });
        if (q.Length > MaxQueryLength)
            return BadRequest(new { message = "Query too long." });

        var sets = await rebrickable.SearchSetsAsync(q);
        return Ok(new { results = sets });
    }
}
