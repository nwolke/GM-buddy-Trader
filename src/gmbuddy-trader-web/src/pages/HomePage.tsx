import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">⚔️ GM Buddy Trader</h1>
      <p className="text-xl text-gray-500 mb-8 max-w-lg mx-auto">
        A virtual stock exchange for your tabletop RPG campaigns. Let your players trade commodities, 
        magic items, and more!
      </p>
      <Link
        to="/campaigns"
        className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        View My Campaigns
      </Link>
    </div>
  );
}
