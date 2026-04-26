using FluentAssertions;
using LegoWebApp.Services;

namespace LegoWebApp.Tests.Unit.Utilities;

public class JwtHelperTests
{
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    // .eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OX0
    // .signature
    private const string ValidJwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
        ".eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OX0" +
        ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    // exp = 1 (far in the past)
    private const string ExpiredJwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
        ".eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MX0" +
        ".signature";

    [Fact]
    public void DecodeClaim_ValidJwt_ReturnsSubClaim()
    {
        var sub = JwtHelper.DecodeClaim<string>(ValidJwt, "sub");
        sub.Should().Be("user-123");
    }

    [Fact]
    public void DecodeClaim_ValidJwt_ReturnsEmailClaim()
    {
        var email = JwtHelper.DecodeClaim<string>(ValidJwt, "email");
        email.Should().Be("test@example.com");
    }

    [Fact]
    public void DecodeClaim_MissingClaim_ReturnsDefault()
    {
        var missing = JwtHelper.DecodeClaim<string>(ValidJwt, "nonexistent_claim");
        missing.Should().BeNull();
    }

    [Fact]
    public void DecodeClaim_MalformedJwt_ReturnsDefault()
    {
        var result = JwtHelper.DecodeClaim<string>("not.a.valid.jwt.at.all", "sub");
        result.Should().BeNull();
    }

    [Fact]
    public void DecodeClaim_EmptyString_ReturnsDefault()
    {
        var result = JwtHelper.DecodeClaim<string>("", "sub");
        result.Should().BeNull();
    }

    [Fact]
    public void DecodeClaim_TwoPartJwt_ReturnsDefault()
    {
        var result = JwtHelper.DecodeClaim<string>("header.payload", "sub");
        result.Should().BeNull();
    }

    [Fact]
    public void DecodeClaim_ExpiredToken_StillDecodesPayload()
    {
        var sub = JwtHelper.DecodeClaim<string>(ExpiredJwt, "sub");
        sub.Should().Be("user-123");
    }

    [Fact]
    public void DecodeClaim_NumericClaim_DecodesCorrectly()
    {
        var exp = JwtHelper.DecodeClaim<long>(ValidJwt, "exp");
        exp.Should().Be(9999999999L);
    }

    [Fact]
    public void DecodeClaim_JwtWithUrlSafeBase64_HandlesCorrectly()
    {
        // JWT with - and _ in base64 (URL-safe encoding)
        const string urlSafeJwt =
            "eyJhbGciOiJIUzI1NiJ9" +
            ".eyJzdWIiOiJ1c2VyX3dpdGhfZGFzaC0xMjMifQ" +
            ".sig";

        var sub = JwtHelper.DecodeClaim<string>(urlSafeJwt, "sub");
        sub.Should().Be("user_with_dash-123");
    }
}
