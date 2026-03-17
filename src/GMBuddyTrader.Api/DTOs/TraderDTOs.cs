namespace GMBuddyTrader.Api.DTOs;

// Campaign DTOs
public record CreateCampaignRequest(string Name, string Description);
public record UpdateCampaignRequest(string Name, string Description, bool IsActive);

public record CampaignResponse(
    Guid Id,
    string Name,
    string Description,
    string GmUserId,
    bool IsActive,
    DateTimeOffset CreatedAt);

// Stock DTOs
public record CreateStockRequest(
    string Symbol,
    string Name,
    string Description,
    decimal InitialPrice,
    long TotalShares);

public record UpdateStockPriceRequest(decimal NewPrice, string? ChangeReason);

public record StockResponse(
    Guid Id,
    Guid CampaignId,
    string Symbol,
    string Name,
    string Description,
    decimal CurrentPrice,
    decimal InitialPrice,
    long TotalShares,
    long AvailableShares,
    bool IsActive,
    DateTimeOffset CreatedAt);

// Portfolio DTOs
public record CreatePortfolioRequest(string PlayerName, decimal InitialCash);

public record PortfolioResponse(
    Guid Id,
    Guid CampaignId,
    string PlayerId,
    string PlayerName,
    decimal CashBalance,
    IEnumerable<HoldingResponse> Holdings,
    DateTimeOffset CreatedAt);

public record HoldingResponse(
    Guid StockId,
    string StockSymbol,
    string StockName,
    long Quantity,
    decimal AveragePurchasePrice,
    decimal CurrentPrice,
    decimal CurrentValue,
    decimal ProfitLoss);

// Trade DTOs
public record PlaceTradeRequest(
    Guid StockId,
    string TradeType,
    long Quantity);

public record TradeResponse(
    Guid Id,
    Guid StockId,
    string StockSymbol,
    string TradeType,
    long Quantity,
    decimal PricePerShare,
    decimal TotalAmount,
    DateTimeOffset ExecutedAt);

// Price History
public record PriceHistoryResponse(
    decimal Price,
    string? ChangeReason,
    DateTimeOffset RecordedAt);
