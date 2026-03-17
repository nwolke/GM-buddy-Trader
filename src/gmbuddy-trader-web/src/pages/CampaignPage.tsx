import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { getCampaign } from '../api/trader';
import StockList from '../components/stocks/StockList';
import Portfolio from '../components/portfolio/Portfolio';

type Tab = 'market' | 'portfolio';

export default function CampaignPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('market');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => getCampaign(campaignId!),
    enabled: !!campaignId,
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!campaign) return <div className="text-center py-12 text-red-500">Campaign not found.</div>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/campaigns" className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
          ← Back to Campaigns
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${campaign.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {campaign.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        {campaign.description && <p className="text-gray-500 text-sm mt-1">{campaign.description}</p>}
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {(['market', 'portfolio'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium border-b-2 capitalize transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'market' ? '📈 Market' : '💼 My Portfolio'}
          </button>
        ))}
      </div>

      {activeTab === 'market' && <StockList />}
      {activeTab === 'portfolio' && <Portfolio />}
    </div>
  );
}
