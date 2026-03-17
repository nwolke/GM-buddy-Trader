import { Outlet, Link, useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function Layout() {
  const navigate = useNavigate();
  const { user } = useAuthenticator();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-xl font-bold tracking-tight">
                ⚔️ GM Buddy Trader
              </Link>
              <Link to="/campaigns" className="text-sm hover:text-indigo-200 transition-colors">
                Campaigns
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-indigo-200">
                {user?.signInDetails?.loginId ?? user?.username}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
