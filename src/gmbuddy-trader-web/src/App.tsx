import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Authenticator } from '@aws-amplify/ui-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@aws-amplify/ui-react/styles.css'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import CampaignsPage from './pages/CampaignsPage'
import CampaignPage from './pages/CampaignPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function App() {
  return (
    <Authenticator
      loginMechanisms={['email']}
      components={{
        Header() {
          return (
            <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#4338ca' }}>
                ⚔️ GM Buddy Trader
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Sign in to manage your campaigns
              </p>
            </div>
          )
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/:campaignId" element={<CampaignPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Authenticator>
  )
}

export default App

