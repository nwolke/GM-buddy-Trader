namespace GMBuddyTrader.Domain.Entities;

public class PlayerPortfolio
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
    public decimal CashBalance { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public Campaign Campaign { get; set; } = null!;
    public ICollection<PortfolioHolding> Holdings { get; set; } = [];
    public ICollection<Trade> Trades { get; set; } = [];
}
