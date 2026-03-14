export interface Campaign {
  id: string;
  name: string;
  description: string;
  gmUserId: string;
  isActive: boolean;
  createdAt: string;
}

export interface Stock {
  id: string;
  campaignId: string;
  symbol: string;
  name: string;
  description: string;
  currentPrice: number;
  initialPrice: number;
  totalShares: number;
  availableShares: number;
  isActive: boolean;
  createdAt: string;
}

export interface Trade {
  id: string;
  stockId: string;
  stockSymbol: string;
  tradeType: 'Buy' | 'Sell';
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  executedAt: string;
}

export interface PortfolioHolding {
  stockId: string;
  stockSymbol: string;
  stockName: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
}

export interface Portfolio {
  id: string;
  campaignId: string;
  playerId: string;
  playerName: string;
  cashBalance: number;
  holdings: PortfolioHolding[];
  createdAt: string;
}

export interface PriceHistory {
  price: number;
  changeReason: string | null;
  recordedAt: string;
}

export interface CreateCampaignRequest {
  name: string;
  description: string;
}

export interface CreateStockRequest {
  symbol: string;
  name: string;
  description: string;
  initialPrice: number;
  totalShares: number;
}

export interface PlaceTradeRequest {
  stockId: string;
  tradeType: 'Buy' | 'Sell';
  quantity: number;
}
