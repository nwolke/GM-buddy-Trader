namespace GMBuddyTrader.Domain.Entities;

public enum TradeType
{
    Buy,
    Sell
}

public class Trade
{
    public Guid Id { get; set; }
    public Guid StockId { get; set; }
    public Guid PortfolioId { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    public TradeType Type { get; set; }
    public long Quantity { get; set; }
    public decimal PricePerShare { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTimeOffset ExecutedAt { get; set; } = DateTimeOffset.UtcNow;

    public Stock Stock { get; set; } = null!;
    public PlayerPortfolio Portfolio { get; set; } = null!;
}
