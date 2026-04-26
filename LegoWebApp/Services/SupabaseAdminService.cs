using System.Net.Http.Headers;

namespace LegoWebApp.Services;

public class SupabaseAdminService(HttpClient http)
{
    private const string SupabaseUrl = "https://owffxalcdjmsukmeccid.supabase.co";

    public async Task<bool> DeleteUserAsync(string userId)
    {
        var response = await http.DeleteAsync($"{SupabaseUrl}/auth/v1/admin/users/{userId}");
        return response.IsSuccessStatusCode;
    }

}
