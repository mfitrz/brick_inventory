using LegoWebApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LegoWebApp.Controllers;

[Route("api/sets")]
public class SetsController(SupabaseAuthService auth, EbayService ebay, RebrickableService rebrickable) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetSets()
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();

        var userId = JwtHelper.DecodeClaim<string>(jwt, "sub");
        if (userId == null) return Unauthorized();

        var sets = await auth.GetAllSetsAsync(jwt, userId);
        return Ok(new { sets });
    }

    [HttpPost]
    public async Task<IActionResult> AddSet(
        [FromQuery] int set_number,
        [FromQuery] string set_name,
        [FromQuery] string? set_image_url,
        [FromQuery] int? set_year = null)
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();

        if (set_number <= 0)
            return BadRequest(new { message = "Invalid set number." });
        if (string.IsNullOrWhiteSpace(set_name) || set_name.Length > 200)
            return BadRequest(new { message = "Set name must be between 1 and 200 characters." });
        if (set_year is < 1949 or > 2100)
            return BadRequest(new { message = "Invalid set year." });

        var userId = JwtHelper.DecodeClaim<string>(jwt, "sub");
        if (userId == null) return Unauthorized();

        var ebayPrice = await ebay.GetAverageSoldPriceAsync(set_number);
        var (success, message) = await auth.AddSetAsync(jwt, userId, set_number, set_name, set_image_url, ebayPrice, set_year);
        if (!success) return Conflict(new { message });

        return Ok(new { message, ebayPrice });
    }

    [HttpGet("lookup")]
    public async Task<IActionResult> LookupSet([FromQuery] int set_number)
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();

        if (set_number <= 0)
            return BadRequest(new { message = "Invalid set number." });

        var setInfo = await rebrickable.GetSetByNumberAsync(set_number);
        if (setInfo == null)
            return NotFound(new { message = $"Set #{set_number} not found." });

        return Ok(new { setNumber = set_number, name = setInfo.Name, imgUrl = setInfo.ImgUrl, year = setInfo.Year });
    }

    [HttpPost("scan")]
    public async Task<IActionResult> ScanSet([FromQuery] int set_number)
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();

        if (set_number <= 0)
            return BadRequest(new { message = "Invalid set number." });

        var userId = JwtHelper.DecodeClaim<string>(jwt, "sub");
        if (userId == null) return Unauthorized();

        var setInfo = await rebrickable.GetSetByNumberAsync(set_number);
        if (setInfo == null)
            return NotFound(new { message = $"Set #{set_number} not found in Rebrickable." });

        var ebayPrice = await ebay.GetAverageSoldPriceAsync(set_number);
        var (success, message) = await auth.AddSetAsync(jwt, userId, set_number, setInfo.Name, setInfo.ImgUrl, ebayPrice, setInfo.Year);
        if (!success) return Conflict(new { message });

        return Ok(new { message, ebayPrice, name = setInfo.Name, imgUrl = setInfo.ImgUrl, year = setInfo.Year });
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteSet([FromQuery] int set_number)
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();

        if (set_number <= 0)
            return BadRequest(new { message = "Invalid set number." });

        var userId = JwtHelper.DecodeClaim<string>(jwt, "sub");
        if (userId == null) return Unauthorized();

        var (success, message) = await auth.DeleteSetAsync(jwt, userId, set_number);
        if (!success) return NotFound(new { message });

        return Ok(new { message });
    }

    [HttpDelete("all")]
    public async Task<IActionResult> DeleteAllSets()
    {
        var jwt = GetJwt();
        if (jwt == null) return Unauthorized();

        var userId = JwtHelper.DecodeClaim<string>(jwt, "sub");
        if (userId == null) return Unauthorized();

        var (success, message) = await auth.DeleteAllSetsAsync(jwt, userId);
        if (!success) return BadRequest(new { message });

        return Ok(new { message });
    }
}
