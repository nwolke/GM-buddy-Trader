namespace GMBuddyTrader.Domain.Entities;

public class PriceHistory
{
    public Guid Id { get; set; }
    public Guid StockId { get; set; }
    public decimal Price { get; set; }
    public string? ChangeReason { get; set; }
    public DateTimeOffset RecordedAt { get; set; } = DateTimeOffset.UtcNow;

    public Stock Stock { get; set; } = null!;
}
