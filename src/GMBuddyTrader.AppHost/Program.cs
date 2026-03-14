var builder = DistributedApplication.CreateBuilder(args);

// PostgreSQL database
var postgres = builder.AddPostgres("postgres")
    .WithDataVolume()
    .WithPgAdmin();

var db = postgres.AddDatabase("gmbuddy-trader-db");

// API backend
var api = builder.AddProject<Projects.GMBuddyTrader_Api>("api")
    .WithReference(db)
    .WaitFor(db);

// React frontend (Vite dev server)
builder.AddNpmApp("web", "../gmbuddy-trader-web")
    .WithReference(api)
    .WithEnvironment("VITE_API_URL", api.GetEndpoint("https"))
    .WithHttpEndpoint(targetPort: 5173, env: "PORT")
    .PublishAsDockerFile();

builder.Build().Run();

