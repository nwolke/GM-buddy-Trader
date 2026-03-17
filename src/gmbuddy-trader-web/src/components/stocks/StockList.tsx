import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { getStocks, createStock, updateStockPrice } from '../../api/trader';
import type { CreateStockRequest } from '../../types';

export default function StockList() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [form, setForm] = useState<CreateStockRequest>({
    symbol: '', name: '', description: '', initialPrice: 100, totalShares: 1000,
  });

  const { data: stocks, isLoading } = useQuery({
    queryKey: ['stocks', campaignId],
    queryFn: () => getStocks(campaignId!),
    enabled: !!campaignId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStockRequest) => createStock(campaignId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks', campaignId] });
      setShowForm(false);
      setForm({ symbol: '', name: '', description: '', initialPrice: 100, totalShares: 1000 });
    },
  });

  const priceMutation = useMutation({
    mutationFn: ({ stockId, price, reason }: { stockId: string; price: number; reason?: string }) =>
      updateStockPrice(campaignId!, stockId, price, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks', campaignId] });
      setSelectedStock(null);
      setNewPrice('');
      setPriceReason('');
    },
  });

  if (isLoading) return <div className="text-gray-500 py-4">Loading stocks...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Market Listings</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          + List Stock
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
          <h3 className="font-semibold mb-3">New Stock Listing</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Symbol</label>
              <input type="text" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1 uppercase" placeholder="GOLD" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" placeholder="Gold Ingots" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" placeholder="Standard gold trade commodity" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Initial Price (gp)</label>
              <input type="number" value={form.initialPrice} onChange={(e) => setForm({ ...form, initialPrice: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Total Shares</label>
              <input type="number" value={form.totalShares} onChange={(e) => setForm({ ...form, totalShares: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => createMutation.mutate(form)} disabled={!form.symbol || createMutation.isPending}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'List Stock'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-gray-500 px-3 py-1.5 rounded text-sm hover:bg-gray-100">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Symbol</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-right">Price (gp)</th>
              <th className="px-4 py-3 text-right">Change</th>
              <th className="px-4 py-3 text-right">Available</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stocks?.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No stocks listed yet</td></tr>
            )}
            {stocks?.map((stock) => {
              const change = ((stock.currentPrice - stock.initialPrice) / stock.initialPrice) * 100;
              return (
                <tr key={stock.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-indigo-700">{stock.symbol}</td>
                  <td className="px-4 py-3 text-gray-700">{stock.name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{stock.currentPrice.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {stock.availableShares.toLocaleString()} / {stock.totalShares.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedStock(selectedStock === stock.id ? null : stock.id)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Update Price
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedStock && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mt-3 shadow-sm">
          <h3 className="font-medium text-sm mb-2">Update Stock Price</h3>
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-gray-600">New Price (gp)</label>
              <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                className="block border border-gray-300 rounded px-2 py-1.5 text-sm mt-1 w-28" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600">Reason (optional)</label>
              <input type="text" value={priceReason} onChange={(e) => setPriceReason(e.target.value)}
                className="block w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" placeholder="Market event..." />
            </div>
            <button
              onClick={() => priceMutation.mutate({ stockId: selectedStock, price: Number(newPrice), reason: priceReason })}
              disabled={!newPrice || priceMutation.isPending}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              Update
            </button>
            <button onClick={() => setSelectedStock(null)} className="text-gray-500 px-2 py-1.5 text-sm hover:bg-gray-100 rounded">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
