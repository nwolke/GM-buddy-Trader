using GMBuddyTrader.Api.DTOs;
using GMBuddyTrader.Domain.Entities;
using GMBuddyTrader.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GMBuddyTrader.Api.Controllers;

[ApiController]
[Route("api/campaigns/{campaignId:guid}/stocks")]
[Authorize]
public class StocksController(TraderDbContext db) : ControllerBase
{
    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identity not found.");

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockResponse>>> GetStocks(Guid campaignId)
    {
        if (!await CampaignAccessible(campaignId))
            return NotFound();

        var stocks = await db.Stocks
            .Where(s => s.CampaignId == campaignId)
            .OrderBy(s => s.Symbol)
            .Select(s => MapToResponse(s))
            .ToListAsync();

        return Ok(stocks);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<StockResponse>> GetStock(Guid campaignId, Guid id)
    {
        if (!await CampaignAccessible(campaignId))
            return NotFound();

        var stock = await db.Stocks
            .Where(s => s.CampaignId == campaignId && s.Id == id)
            .FirstOrDefaultAsync();

        if (stock is null)
            return NotFound();

        return Ok(MapToResponse(stock));
    }

    [HttpPost]
    public async Task<ActionResult<StockResponse>> CreateStock(Guid campaignId, CreateStockRequest request)
    {
        if (!await IsGm(campaignId))
            return Forbid();

        var stock = new Stock
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            Symbol = request.Symbol.ToUpperInvariant(),
            Name = request.Name,
            Description = request.Description,
            InitialPrice = request.InitialPrice,
            CurrentPrice = request.InitialPrice,
            TotalShares = request.TotalShares,
            AvailableShares = request.TotalShares,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Stocks.Add(stock);

        db.PriceHistory.Add(new PriceHistory
        {
            Id = Guid.NewGuid(),
            StockId = stock.Id,
            Price = stock.InitialPrice,
            ChangeReason = "Initial price",
            RecordedAt = DateTimeOffset.UtcNow
        });

        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetStock), new { campaignId, id = stock.Id }, MapToResponse(stock));
    }

    [HttpPatch("{id:guid}/price")]
    public async Task<IActionResult> UpdateStockPrice(Guid campaignId, Guid id, UpdateStockPriceRequest request)
    {
        if (!await IsGm(campaignId))
            return Forbid();

        var stock = await db.Stocks
            .Where(s => s.CampaignId == campaignId && s.Id == id)
            .FirstOrDefaultAsync();

        if (stock is null)
            return NotFound();

        stock.CurrentPrice = request.NewPrice;
        stock.UpdatedAt = DateTimeOffset.UtcNow;

        db.PriceHistory.Add(new PriceHistory
        {
            Id = Guid.NewGuid(),
            StockId = stock.Id,
            Price = request.NewPrice,
            ChangeReason = request.ChangeReason,
            RecordedAt = DateTimeOffset.UtcNow
        });

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/history")]
    public async Task<ActionResult<IEnumerable<PriceHistoryResponse>>> GetPriceHistory(Guid campaignId, Guid id)
    {
        if (!await CampaignAccessible(campaignId))
            return NotFound();

        var history = await db.PriceHistory
            .Where(p => p.StockId == id && p.Stock.CampaignId == campaignId)
            .OrderByDescending(p => p.RecordedAt)
            .Select(p => new PriceHistoryResponse(p.Price, p.ChangeReason, p.RecordedAt))
            .ToListAsync();

        return Ok(history);
    }

    private async Task<bool> CampaignAccessible(Guid campaignId)
    {
        var userId = CurrentUserId;
        return await db.Campaigns.AnyAsync(c =>
            c.Id == campaignId &&
            (c.GmUserId == userId || c.Portfolios.Any(p => p.PlayerId == userId)));
    }

    private async Task<bool> IsGm(Guid campaignId)
    {
        var userId = CurrentUserId;
        return await db.Campaigns.AnyAsync(c => c.Id == campaignId && c.GmUserId == userId);
    }

    private static StockResponse MapToResponse(Stock s) =>
        new(s.Id, s.CampaignId, s.Symbol, s.Name, s.Description,
            s.CurrentPrice, s.InitialPrice, s.TotalShares, s.AvailableShares, s.IsActive, s.CreatedAt);
}
