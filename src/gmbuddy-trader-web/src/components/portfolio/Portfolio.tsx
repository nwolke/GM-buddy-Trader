import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { getMyPortfolio, createPortfolio, placeTrade, getStocks } from '../../api/trader';
import type { PlaceTradeRequest } from '../../types';

export default function Portfolio() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const queryClient = useQueryClient();
  const [playerName, setPlayerName] = useState('');
  const [initialCash, setInitialCash] = useState(1000);
  const [tradeForm, setTradeForm] = useState<Partial<PlaceTradeRequest>>({ tradeType: 'Buy' });

  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ['portfolio', campaignId],
    queryFn: () => getMyPortfolio(campaignId!),
    enabled: !!campaignId,
    retry: false,
  });

  const { data: stocks } = useQuery({
    queryKey: ['stocks', campaignId],
    queryFn: () => getStocks(campaignId!),
    enabled: !!campaignId,
  });

  const joinMutation = useMutation({
    mutationFn: () => createPortfolio(campaignId!, playerName, initialCash),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio', campaignId] }),
  });

  const tradeMutation = useMutation({
    mutationFn: (data: PlaceTradeRequest) => placeTrade(campaignId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['stocks', campaignId] });
      setTradeForm({ tradeType: 'Buy' });
    },
  });

  if (isLoading) return <div className="text-gray-500 py-4">Loading portfolio...</div>;

  // 404 - not joined yet
  const notJoined = error && (error as { response?: { status?: number } }).response?.status === 404;

  if (notJoined) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Join Campaign</h2>
        <p className="text-sm text-gray-500 mb-4">You haven't joined this campaign's exchange yet. Create your portfolio to start trading.</p>
        <div className="space-y-3 max-w-sm">
          <div>
            <label className="text-sm font-medium text-gray-700">Player Name</label>
            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
              className="block w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1" placeholder="Thorin Oakenshield" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Starting Gold (gp)</label>
            <input type="number" value={initialCash} onChange={(e) => setInitialCash(Number(e.target.value))}
              className="block w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1" />
          </div>
          <button
            onClick={() => joinMutation.mutate()}
            disabled={!playerName || joinMutation.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {joinMutation.isPending ? 'Joining...' : 'Join Exchange'}
          </button>
        </div>
      </div>
    );
  }

  if (!portfolio) return null;

  const totalValue = portfolio.holdings.reduce((sum, h) => sum + h.currentValue, 0) + portfolio.cashBalance;
  const totalPL = portfolio.holdings.reduce((sum, h) => sum + h.profitLoss, 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Cash Balance</p>
          <p className="text-xl font-bold text-gray-900">{portfolio.cashBalance.toFixed(2)} gp</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Portfolio Value</p>
          <p className="text-xl font-bold text-gray-900">{totalValue.toFixed(2)} gp</p>
        </div>
        <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm`}>
          <p className="text-xs text-gray-500 mb-1">Total P&L</p>
          <p className={`text-xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPL >= 0 ? '+' : ''}{totalPL.toFixed(2)} gp
          </p>
        </div>
      </div>

      {/* Holdings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Holdings</h3>
        </div>
        {portfolio.holdings.length === 0 ? (
          <p className="text-center py-6 text-gray-400 text-sm">No holdings yet. Buy some stocks below!</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2.5 text-left">Symbol</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                <th className="px-4 py-2.5 text-right">Avg Price</th>
                <th className="px-4 py-2.5 text-right">Current</th>
                <th className="px-4 py-2.5 text-right">Value</th>
                <th className="px-4 py-2.5 text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {portfolio.holdings.map((h) => (
                <tr key={h.stockId} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-bold text-indigo-700">{h.stockSymbol}</td>
                  <td className="px-4 py-2.5 text-right">{h.quantity}</td>
                  <td className="px-4 py-2.5 text-right">{h.averagePurchasePrice.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right">{h.currentPrice.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{h.currentValue.toFixed(2)}</td>
                  <td className={`px-4 py-2.5 text-right font-medium ${h.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {h.profitLoss >= 0 ? '+' : ''}{h.profitLoss.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Trade Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold mb-3">Place Trade</h3>
        {tradeMutation.isError && (
          <div className="bg-red-50 text-red-600 text-sm rounded px-3 py-2 mb-3">
            {(tradeMutation.error as { response?: { data?: string } }).response?.data ?? 'Trade failed'}
          </div>
        )}
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-gray-600">Stock</label>
            <select value={tradeForm.stockId ?? ''} onChange={(e) => setTradeForm({ ...tradeForm, stockId: e.target.value })}
              className="block w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
              <option value="">Select...</option>
              {stocks?.filter(s => s.isActive).map(s => (
                <option key={s.id} value={s.id}>{s.symbol} — {s.currentPrice.toFixed(2)} gp</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Type</label>
            <select value={tradeForm.tradeType} onChange={(e) => setTradeForm({ ...tradeForm, tradeType: e.target.value as 'Buy' | 'Sell' })}
              className="block w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Quantity</label>
            <input type="number" min="1" value={tradeForm.quantity ?? ''} onChange={(e) => setTradeForm({ ...tradeForm, quantity: Number(e.target.value) })}
              className="block w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
          </div>
          <button
            onClick={() => tradeMutation.mutate(tradeForm as PlaceTradeRequest)}
            disabled={!tradeForm.stockId || !tradeForm.quantity || tradeMutation.isPending}
            className={`py-1.5 px-4 rounded text-sm font-medium text-white disabled:opacity-50 ${tradeForm.tradeType === 'Buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {tradeMutation.isPending ? 'Executing...' : `${tradeForm.tradeType ?? 'Trade'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
