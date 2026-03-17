import apiClient from './client';
import type {
  Campaign,
  CreateCampaignRequest,
  CreateStockRequest,
  PlaceTradeRequest,
  Portfolio,
  PriceHistory,
  Stock,
  Trade,
} from '../types';

// Campaigns
export const getCampaigns = () =>
  apiClient.get<Campaign[]>('/api/campaigns').then((r) => r.data);

export const getCampaign = (id: string) =>
  apiClient.get<Campaign>(`/api/campaigns/${id}`).then((r) => r.data);

export const createCampaign = (data: CreateCampaignRequest) =>
  apiClient.post<Campaign>('/api/campaigns', data).then((r) => r.data);

export const deleteCampaign = (id: string) =>
  apiClient.delete(`/api/campaigns/${id}`);

// Stocks
export const getStocks = (campaignId: string) =>
  apiClient.get<Stock[]>(`/api/campaigns/${campaignId}/stocks`).then((r) => r.data);

export const createStock = (campaignId: string, data: CreateStockRequest) =>
  apiClient.post<Stock>(`/api/campaigns/${campaignId}/stocks`, data).then((r) => r.data);

export const updateStockPrice = (campaignId: string, stockId: string, newPrice: number, reason?: string) =>
  apiClient.patch(`/api/campaigns/${campaignId}/stocks/${stockId}/price`, {
    newPrice,
    changeReason: reason,
  });

export const getPriceHistory = (campaignId: string, stockId: string) =>
  apiClient.get<PriceHistory[]>(`/api/campaigns/${campaignId}/stocks/${stockId}/history`).then((r) => r.data);

// Portfolio
export const getMyPortfolio = (campaignId: string) =>
  apiClient.get<Portfolio>(`/api/campaigns/${campaignId}/portfolio`).then((r) => r.data);

export const createPortfolio = (campaignId: string, playerName: string, initialCash: number) =>
  apiClient.post<Portfolio>(`/api/campaigns/${campaignId}/portfolio`, { playerName, initialCash }).then((r) => r.data);

export const placeTrade = (campaignId: string, data: PlaceTradeRequest) =>
  apiClient.post<Trade>(`/api/campaigns/${campaignId}/portfolio/trades`, data).then((r) => r.data);

export const getMyTrades = (campaignId: string) =>
  apiClient.get<Trade[]>(`/api/campaigns/${campaignId}/portfolio/trades`).then((r) => r.data);

export const getAllPortfolios = (campaignId: string) =>
  apiClient.get<Portfolio[]>(`/api/campaigns/${campaignId}/portfolio/all`).then((r) => r.data);
