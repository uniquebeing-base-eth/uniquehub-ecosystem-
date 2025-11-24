import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/hooks/useAuth';
import { PlatformGuard } from '@/components/PlatformGuard';
import { wagmiConfig } from '@/config/wagmi';
import Dashboard from './pages/Dashboard.tsx'
import Home from './pages/Home.tsx'
import Earn from './pages/Earn.tsx'
import Marketplace from './pages/Marketplace.tsx'
import Courses from './pages/Courses.tsx'
import Quest from './pages/Quest.tsx'
import NFT from './pages/NFT.tsx'
import Profile from './pages/Profile.tsx'
import Tutor from './pages/Tutor.tsx'
import Upload from './pages/Upload.tsx'
import Wallet from './pages/Wallet.tsx'
import Blog from './pages/Blog.tsx'
import Certificates from './pages/Certificates.tsx'
import Leaderboard from './pages/Leaderboard.tsx'
import About from './pages/About.tsx'
import Contact from './pages/Contact.tsx'
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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PlatformGuard>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Dashboard />}>
                  <Route index element={<Home />} />
                  <Route path="earn" element={<Earn />} />
                  <Route path="marketplace" element={<Marketplace />} />
                  <Route path="courses" element={<Courses />} />
                  <Route path="quest" element={<Quest />} />
                  <Route path="nft" element={<NFT />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="tutor" element={<Tutor />} />
                  <Route path="upload" element={<Upload />} />
                  <Route path="wallet" element={<Wallet />} />
                  <Route path="blog" element={<Blog />} />
                  <Route path="certificates" element={<Certificates />} />
                  <Route path="leaderboard" element={<Leaderboard />} />
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </PlatformGuard>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
