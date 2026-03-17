# GM-buddy-Trader

A virtual stock exchange system for TTRPG campaigns, built as part of the [GM Buddy](https://github.com/nwolke/gm_buddy) ecosystem.

GMs can create per-campaign exchanges where players trade virtual commodities (gold, magic items, spell components, etc.) with real-time price management.

## Architecture

This is a **.NET Aspire** hosted n-tier web application:

```
GMBuddyTrader.slnx
├── src/
│   ├── GMBuddyTrader.AppHost/       # .NET Aspire orchestrator
│   ├── GMBuddyTrader.ServiceDefaults/  # Shared OpenTelemetry & health checks
│   ├── GMBuddyTrader.Domain/        # Domain entities (Campaign, Stock, Trade, etc.)
│   ├── GMBuddyTrader.Infrastructure/# EF Core + PostgreSQL data access
│   ├── GMBuddyTrader.Api/           # ASP.NET Core Web API
│   └── gmbuddy-trader-web/          # React + TypeScript frontend (Vite)
├── Dockerfile.api                   # API container
├── Dockerfile.web                   # React frontend container (nginx)
└── docker-compose.yml               # Local container orchestration
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Auth | AWS Cognito via AWS Amplify |
| API | ASP.NET Core 9 Web API |
| ORM | Entity Framework Core 9 |
| Database | PostgreSQL 17 |
| Orchestration | .NET Aspire 9.2 |
| Hosting | AWS (ECS/EKS + RDS + Cognito) |
| Observability | OpenTelemetry |

## Domain Model

- **Campaign** — A GM creates a campaign; each campaign has its own virtual exchange
- **Stock** — A tradeable asset (e.g. "GOLD", "MANA", "SILK") with price history
- **PlayerPortfolio** — A player's cash balance + holdings within a campaign
- **PortfolioHolding** — Shares of a specific stock held by a player
- **Trade** — A buy/sell transaction recorded with price and timestamp
- **PriceHistory** — Time-series price data per stock (GM-controlled)

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local PostgreSQL)
- AWS account with Cognito User Pool configured

## Getting Started (Development)

### 1. Configure AWS Cognito

Create a Cognito User Pool with:
- App client (no client secret for SPA)
- `email` as a sign-in method
- OAuth 2.0 Authorization Code flow with PKCE

### 2. Set up configuration

Create `src/GMBuddyTrader.Api/appsettings.Development.json` user secrets:
```bash
cd src/GMBuddyTrader.Api
dotnet user-secrets set "AWS:Cognito:Authority" "https://cognito-idp.{region}.amazonaws.com/{userPoolId}"
dotnet user-secrets set "AWS:Cognito:ClientId" "{appClientId}"
```

Create `src/gmbuddy-trader-web/.env.local`:
```env
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_API_URL=http://localhost:5001
```

### 3. Run with .NET Aspire (recommended)

```bash
cd src/GMBuddyTrader.AppHost
dotnet run
```

This starts:
- PostgreSQL container with pgAdmin
- ASP.NET Core API (with auto-migration)
- React Vite dev server

Open the Aspire dashboard at `https://localhost:15888`.

### 4. Run with Docker Compose

```bash
# Copy and fill in your Cognito values
cp src/gmbuddy-trader-web/.env.example .env

docker-compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:5001
- Swagger: http://localhost:5001/swagger

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/campaigns` | List GM's campaigns |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/{id}` | Get campaign details |
| PUT | `/api/campaigns/{id}` | Update campaign |
| DELETE | `/api/campaigns/{id}` | Delete campaign |
| GET | `/api/campaigns/{id}/stocks` | List stocks |
| POST | `/api/campaigns/{id}/stocks` | Create stock listing |
| PATCH | `/api/campaigns/{id}/stocks/{sid}/price` | Update stock price |
| GET | `/api/campaigns/{id}/stocks/{sid}/history` | Price history |
| GET | `/api/campaigns/{id}/portfolio` | My portfolio |
| POST | `/api/campaigns/{id}/portfolio` | Join campaign exchange |
| POST | `/api/campaigns/{id}/portfolio/trades` | Buy/sell stock |
| GET | `/api/campaigns/{id}/portfolio/trades` | My trade history |
| GET | `/api/campaigns/{id}/portfolio/all` | All portfolios (GM only) |

All endpoints require a valid Cognito JWT Bearer token.

## AWS Deployment

Deploy to AWS using:
- **Amazon ECS** (Fargate) for API and frontend containers
- **Amazon RDS** (PostgreSQL) for the database
- **Amazon Cognito** for authentication
- **AWS ALB** for load balancing and SSL termination
- **Amazon ECR** for container registry

Infrastructure-as-Code with AWS CDK or Terraform is recommended. Configure the following environment variables on ECS tasks:

**API Task:**
```
ConnectionStrings__gmbuddy-trader-db=Host=<rds-endpoint>;Port=5432;Database=gmbuddy_trader;Username=...;Password=...
AWS__Cognito__Authority=https://cognito-idp.{region}.amazonaws.com/{userPoolId}
AWS__Cognito__ClientId={appClientId}
Cors__AllowedOrigins__0=https://your-frontend-domain.com
```

## Database Migrations

EF Core migrations run automatically on API startup. To add new migrations:

```bash
cd src/GMBuddyTrader.Api
dotnet ef migrations add <MigrationName> --project ../GMBuddyTrader.Infrastructure
```

