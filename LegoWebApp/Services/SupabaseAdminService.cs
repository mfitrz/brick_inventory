using System.Net.Http.Headers;

namespace LegoWebApp.Services;

public class SupabaseAdminService(HttpClient http)
{
    public async Task<bool> DeleteUserAsync(string userId)
    {
        var response = await http.DeleteAsync($"/auth/v1/admin/users/{userId}");
        return response.IsSuccessStatusCode;
    }

}
