namespace GMBuddyTrader.Domain.Entities;

public class Stock
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal CurrentPrice { get; set; }
    public decimal InitialPrice { get; set; }
    public long TotalShares { get; set; }
    public long AvailableShares { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public Campaign Campaign { get; set; } = null!;
    public ICollection<Trade> Trades { get; set; } = [];
    public ICollection<PriceHistory> PriceHistory { get; set; } = [];
}
