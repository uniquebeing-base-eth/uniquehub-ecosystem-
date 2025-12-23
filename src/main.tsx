import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { Toaster } from "@/components/ui/sonner";
import { PrivyProvider } from '@/providers/PrivyProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { wagmiConfig } from '@/config/wagmi';
import Dashboard from './pages/Dashboard.tsx'
import Auth from './pages/Auth.tsx'
import NotFound from './pages/NotFound.tsx'
import './index.css'

const queryClient = new QueryClient();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration handled by vite-plugin-pwa
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  </StrictMode>,
)
