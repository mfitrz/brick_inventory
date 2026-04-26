using Microsoft.AspNetCore.Mvc;

namespace LegoWebApp.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected string? GetJwt() =>
        Request.Headers.Authorization.FirstOrDefault()?.Replace("Bearer ", "");

    protected static bool IsValidEmail(string email) =>
        System.Net.Mail.MailAddress.TryCreate(email, out _);
}
