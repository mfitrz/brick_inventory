using LegoWebApp.Services;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(opts =>
    opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var apiBaseUrl = builder.Configuration["LegoApi:BaseUrl"] ?? "";
var supabaseUrl = builder.Configuration["Supabase:Url"] ?? "";
var supabaseAnonKey = builder.Configuration["Supabase:AnonKey"] ?? "";

builder.Services.AddHttpClient<LegoApiClient>(client =>
    client.BaseAddress = new Uri(apiBaseUrl));

builder.Services.AddHttpClient<SupabaseAuthService>(client =>
{
    client.BaseAddress = new Uri(supabaseUrl);
    client.DefaultRequestHeaders.Add("apikey", supabaseAnonKey);
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();

    var spaPath = Path.Combine(app.Environment.ContentRootPath, "ClientApp", "dist");
    var spaProvider = new PhysicalFileProvider(spaPath);
    app.UseStaticFiles(new StaticFileOptions { FileProvider = spaProvider });
    app.MapFallbackToFile("index.html", new StaticFileOptions { FileProvider = spaProvider });
}

app.UseCors();
app.MapControllers();

app.Run();
