namespace GMBuddyTrader.Domain.Entities;

public class PortfolioHolding
{
    public Guid Id { get; set; }
    public Guid PortfolioId { get; set; }
    public Guid StockId { get; set; }
    public long Quantity { get; set; }
    public decimal AveragePurchasePrice { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public PlayerPortfolio Portfolio { get; set; } = null!;
    public Stock Stock { get; set; } = null!;
}
