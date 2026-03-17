using GMBuddyTrader.Api.DTOs;
using GMBuddyTrader.Domain.Entities;
using GMBuddyTrader.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GMBuddyTrader.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CampaignsController(TraderDbContext db) : ControllerBase
{
    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identity not found.");

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CampaignResponse>>> GetCampaigns()
    {
        var userId = CurrentUserId;
        var campaigns = await db.Campaigns
            .Where(c => c.GmUserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CampaignResponse(c.Id, c.Name, c.Description, c.GmUserId, c.IsActive, c.CreatedAt))
            .ToListAsync();

        return Ok(campaigns);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CampaignResponse>> GetCampaign(Guid id)
    {
        var userId = CurrentUserId;
        var campaign = await db.Campaigns
            .Where(c => c.Id == id && c.GmUserId == userId)
            .FirstOrDefaultAsync();

        if (campaign is null)
            return NotFound();

        return Ok(new CampaignResponse(campaign.Id, campaign.Name, campaign.Description, campaign.GmUserId, campaign.IsActive, campaign.CreatedAt));
    }

    [HttpPost]
    public async Task<ActionResult<CampaignResponse>> CreateCampaign(CreateCampaignRequest request)
    {
        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            GmUserId = CurrentUserId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Campaigns.Add(campaign);
        await db.SaveChangesAsync();

        var response = new CampaignResponse(campaign.Id, campaign.Name, campaign.Description, campaign.GmUserId, campaign.IsActive, campaign.CreatedAt);
        return CreatedAtAction(nameof(GetCampaign), new { id = campaign.Id }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCampaign(Guid id, UpdateCampaignRequest request)
    {
        var userId = CurrentUserId;
        var campaign = await db.Campaigns
            .Where(c => c.Id == id && c.GmUserId == userId)
            .FirstOrDefaultAsync();

        if (campaign is null)
            return NotFound();

        campaign.Name = request.Name;
        campaign.Description = request.Description;
        campaign.IsActive = request.IsActive;
        campaign.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCampaign(Guid id)
    {
        var userId = CurrentUserId;
        var campaign = await db.Campaigns
            .Where(c => c.Id == id && c.GmUserId == userId)
            .FirstOrDefaultAsync();

        if (campaign is null)
            return NotFound();

        db.Campaigns.Remove(campaign);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
