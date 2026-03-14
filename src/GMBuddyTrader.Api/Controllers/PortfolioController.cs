using GMBuddyTrader.Api.DTOs;
using GMBuddyTrader.Domain.Entities;
using GMBuddyTrader.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GMBuddyTrader.Api.Controllers;

[ApiController]
[Route("api/campaigns/{campaignId:guid}/portfolio")]
[Authorize]
public class PortfolioController(TraderDbContext db) : ControllerBase
{
    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identity not found.");

    [HttpGet]
    public async Task<ActionResult<PortfolioResponse>> GetMyPortfolio(Guid campaignId)
    {
        var userId = CurrentUserId;
        var portfolio = await db.Portfolios
            .Include(p => p.Holdings)
                .ThenInclude(h => h.Stock)
            .Where(p => p.CampaignId == campaignId && p.PlayerId == userId)
            .FirstOrDefaultAsync();

        if (portfolio is null)
            return NotFound();

        return Ok(MapToResponse(portfolio));
    }

    [HttpGet("all")]
    public async Task<ActionResult<IEnumerable<PortfolioResponse>>> GetAllPortfolios(Guid campaignId)
    {
        var userId = CurrentUserId;
        if (!await db.Campaigns.AnyAsync(c => c.Id == campaignId && c.GmUserId == userId))
            return Forbid();

        var portfolios = await db.Portfolios
            .Include(p => p.Holdings)
                .ThenInclude(h => h.Stock)
            .Where(p => p.CampaignId == campaignId)
            .ToListAsync();

        return Ok(portfolios.Select(MapToResponse));
    }

    [HttpPost]
    public async Task<ActionResult<PortfolioResponse>> CreatePortfolio(Guid campaignId, CreatePortfolioRequest request)
    {
        var userId = CurrentUserId;

        // Only GM can create portfolios for players, or a player can self-register
        if (!await db.Campaigns.AnyAsync(c => c.Id == campaignId))
            return NotFound();

        var existing = await db.Portfolios
            .AnyAsync(p => p.CampaignId == campaignId && p.PlayerId == userId);

        if (existing)
            return Conflict("Portfolio already exists for this campaign.");

        var portfolio = new PlayerPortfolio
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            PlayerId = userId,
            PlayerName = request.PlayerName,
            CashBalance = request.InitialCash,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Portfolios.Add(portfolio);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMyPortfolio), new { campaignId }, MapToResponse(portfolio));
    }

    [HttpPost("trades")]
    public async Task<ActionResult<TradeResponse>> PlaceTrade(Guid campaignId, PlaceTradeRequest request)
    {
        var userId = CurrentUserId;

        if (!Enum.TryParse<TradeType>(request.TradeType, ignoreCase: true, out var tradeType))
            return BadRequest("Invalid trade type. Use 'Buy' or 'Sell'.");

        var portfolio = await db.Portfolios
            .Include(p => p.Holdings)
            .Where(p => p.CampaignId == campaignId && p.PlayerId == userId)
            .FirstOrDefaultAsync();

        if (portfolio is null)
            return NotFound("Portfolio not found. Join the campaign first.");

        var stock = await db.Stocks
            .Where(s => s.Id == request.StockId && s.CampaignId == campaignId && s.IsActive)
            .FirstOrDefaultAsync();

        if (stock is null)
            return NotFound("Stock not found or inactive.");

        if (request.Quantity <= 0)
            return BadRequest("Quantity must be positive.");

        var totalCost = stock.CurrentPrice * request.Quantity;
        Trade trade;

        if (tradeType == TradeType.Buy)
        {
            if (stock.AvailableShares < request.Quantity)
                return BadRequest("Insufficient shares available.");

            if (portfolio.CashBalance < totalCost)
                return BadRequest("Insufficient funds.");

            stock.AvailableShares -= request.Quantity;
            portfolio.CashBalance -= totalCost;

            var holding = portfolio.Holdings.FirstOrDefault(h => h.StockId == stock.Id);
            if (holding is null)
            {
                holding = new PortfolioHolding
                {
                    Id = Guid.NewGuid(),
                    PortfolioId = portfolio.Id,
                    StockId = stock.Id,
                    Quantity = 0,
                    AveragePurchasePrice = 0
                };
                portfolio.Holdings.Add(holding);
            }

            var totalValue = holding.AveragePurchasePrice * holding.Quantity + totalCost;
            holding.Quantity += request.Quantity;
            holding.AveragePurchasePrice = totalValue / holding.Quantity;
            holding.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            var holding = portfolio.Holdings.FirstOrDefault(h => h.StockId == stock.Id);
            if (holding is null || holding.Quantity < request.Quantity)
                return BadRequest("Insufficient shares in portfolio.");

            stock.AvailableShares += request.Quantity;
            portfolio.CashBalance += totalCost;
            holding.Quantity -= request.Quantity;
            holding.UpdatedAt = DateTimeOffset.UtcNow;

            if (holding.Quantity == 0)
                db.Holdings.Remove(holding);
        }

        trade = new Trade
        {
            Id = Guid.NewGuid(),
            StockId = stock.Id,
            PortfolioId = portfolio.Id,
            PlayerId = userId,
            Type = tradeType,
            Quantity = request.Quantity,
            PricePerShare = stock.CurrentPrice,
            TotalAmount = totalCost,
            ExecutedAt = DateTimeOffset.UtcNow
        };

        db.Trades.Add(trade);
        portfolio.UpdatedAt = DateTimeOffset.UtcNow;
        stock.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();

        return Ok(new TradeResponse(
            trade.Id,
            trade.StockId,
            stock.Symbol,
            trade.Type.ToString(),
            trade.Quantity,
            trade.PricePerShare,
            trade.TotalAmount,
            trade.ExecutedAt));
    }

    [HttpGet("trades")]
    public async Task<ActionResult<IEnumerable<TradeResponse>>> GetTrades(Guid campaignId)
    {
        var userId = CurrentUserId;
        var trades = await db.Trades
            .Include(t => t.Stock)
            .Where(t => t.Stock.CampaignId == campaignId && t.PlayerId == userId)
            .OrderByDescending(t => t.ExecutedAt)
            .Select(t => new TradeResponse(
                t.Id,
                t.StockId,
                t.Stock.Symbol,
                t.Type.ToString(),
                t.Quantity,
                t.PricePerShare,
                t.TotalAmount,
                t.ExecutedAt))
            .ToListAsync();

        return Ok(trades);
    }

    private static PortfolioResponse MapToResponse(PlayerPortfolio p) =>
        new(
            p.Id,
            p.CampaignId,
            p.PlayerId,
            p.PlayerName,
            p.CashBalance,
            p.Holdings.Select(h => new HoldingResponse(
                h.StockId,
                h.Stock?.Symbol ?? string.Empty,
                h.Stock?.Name ?? string.Empty,
                h.Quantity,
                h.AveragePurchasePrice,
                h.Stock?.CurrentPrice ?? 0,
                h.Quantity * (h.Stock?.CurrentPrice ?? 0),
                h.Quantity * (h.Stock?.CurrentPrice ?? 0) - h.Quantity * h.AveragePurchasePrice)),
            p.CreatedAt);
}
