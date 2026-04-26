using LegoWebApp.Services;

var builder = WebApplication.CreateBuilder(args);

var envPath = Path.Combine(builder.Environment.ContentRootPath, ".env");
if (File.Exists(envPath))
{
    DotNetEnv.Env.Load(envPath);
    builder.Configuration.AddEnvironmentVariables();
}

builder.Services.AddControllers().AddJsonOptions(opts =>
    opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var supabaseUrl = builder.Configuration["Supabase:Url"] ?? "";
var supabaseAnonKey = builder.Configuration["Supabase:AnonKey"] ?? "";

builder.Services.AddHttpClient<SupabaseAuthService>(client =>
{
    if (!string.IsNullOrEmpty(supabaseUrl))
        client.BaseAddress = new Uri(supabaseUrl);
    client.DefaultRequestHeaders.Add("apikey", supabaseAnonKey);
});

builder.Services.AddHttpClient<RebrickableService>();
builder.Services.AddSingleton<EbayTokenCache>();
builder.Services.AddSingleton<EbayPriceCache>();
builder.Services.AddHttpClient<EbayService>();
builder.Services.AddHttpClient<ClaudePredictionService>();

var supabaseServiceRoleKey = builder.Configuration["Supabase:ServiceRoleKey"] ?? "";
builder.Services.AddHttpClient<SupabaseAdminService>(client =>
{
    if (!string.IsNullOrEmpty(supabaseUrl))
        client.BaseAddress = new Uri(supabaseUrl);
    client.DefaultRequestHeaders.Add("apikey", supabaseServiceRoleKey);
    client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", supabaseServiceRoleKey);
});

var app = builder.Build();


app.UseCors();
app.MapControllers();

app.Run();
