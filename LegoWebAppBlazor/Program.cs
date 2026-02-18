using LegoWebAppBlazor.Components;
using LegoWebAppBlazor.Services;

var builder = WebApplication.CreateBuilder(args);

// Blazor components with interactive server rendering
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// Auth state — scoped = one instance per Blazor circuit (per user/tab)
builder.Services.AddScoped<AuthStateService>();

// Read config values from appsettings.json
var apiBaseUrl = builder.Configuration["LegoApi:BaseUrl"] ?? "";
var supabaseUrl = builder.Configuration["Supabase:Url"] ?? "";
var supabaseAnonKey = builder.Configuration["Supabase:AnonKey"] ?? "";

// HttpClient for our FastAPI backend (LEGO set CRUD)
builder.Services.AddHttpClient<LegoApiClient>(client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
});

// HttpClient for Supabase Auth (login/signup)
builder.Services.AddHttpClient<SupabaseAuthService>(client =>
{
    client.BaseAddress = new Uri(supabaseUrl);
    client.DefaultRequestHeaders.Add("apikey", supabaseAnonKey);
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseAntiforgery();
app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
