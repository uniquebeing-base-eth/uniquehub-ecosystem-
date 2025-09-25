import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/hooks/useAuth';
import Dashboard from './pages/Dashboard.tsx'
import NotFound from './pages/NotFound.tsx'
import './index.css'

const queryClient = new QueryClient();

// Farcaster SDK ready call for proper loading
if (typeof window !== 'undefined' && window.location.pathname !== '/') {
  // Check if we're in a Farcaster context and call ready when app loads
  setTimeout(() => {
    try {
      if (typeof (window as any).parent !== 'undefined') {
        import('@farcaster/miniapp-sdk').then(({ sdk }) => {
          sdk.actions.ready();
        }).catch(() => {
          // SDK not available, continue normally
        });
      }
    } catch (error) {
      // Continue normally if SDK is not available
    }
  }, 100);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
