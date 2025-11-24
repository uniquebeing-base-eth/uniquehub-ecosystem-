import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Dashboard from "./pages/Dashboard";
import NFTs from "./pages/NFTs";
import NotFound from "./pages/NotFound";
import { AchievementClaimModal } from "@/components/AchievementClaimModal";
import { useUnclaimedAchievements } from "@/hooks/useUnclaimedAchievements";

const queryClient = new QueryClient();

const AppContent = () => {
  const { achievements, showModal, setShowModal, refetch } = useUnclaimedAchievements();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/nfts" element={<NFTs />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <AchievementClaimModal
        open={showModal}
        onOpenChange={setShowModal}
        achievements={achievements}
        onClaimed={refetch}
      />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
