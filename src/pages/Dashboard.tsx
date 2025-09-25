import React, { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { HomeSection } from "@/components/sections/HomeSection";
import { MarketplaceSection } from "@/components/sections/MarketplaceSection";
import { CoursesSection } from "@/components/sections/CoursesSection";
import { EarningSection } from "@/components/sections/EarningSection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { TutorSection } from "@/components/sections/TutorSection";
import { WalletConnector } from "@/components/WalletConnector";
import { FarcasterAuth } from "@/components/FarcasterAuth";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Initialize Farcaster SDK when component mounts
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        // Call ready to hide splash screen
        await sdk.actions.ready();
      } catch (error) {
        // SDK not available or not in Farcaster context, continue normally
        console.log('Farcaster SDK not available');
      }
    };

    initializeFarcaster();
  }, []);

  const handleTabChange = (tab: string) => {
    // Check if tab requires authentication
    const protectedTabs = ['profile', 'tutor'];
    
    if (protectedTabs.includes(tab) && !user) {
      setShowAuthModal(true);
      return;
    }
    
    setActiveTab(tab);
    setShowAuthModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (showAuthModal) {
      return (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="max-w-md bg-card/90 backdrop-blur-sm rounded-xl p-6 border border-border">
            <FarcasterAuth />
            <div className="text-center mt-4">
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "home":
        return <HomeSection />;
      case "marketplace":
        return <MarketplaceSection />;
      case "courses":
        return <CoursesSection />;
      case "earning":
        return <EarningSection />;
      case "profile":
        return <ProfileSection />;
      case "tutor":
        return <TutorSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto px-6 py-8 content-overlay">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-2xl font-bold text-primary">UniqueHub</h1>
        </div>

        {/* Navigation - Always visible */}
        <div className="flex justify-center mb-8">
          <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Content */}
        {renderContent()}
      </div>
      
      {/* Wallet Connector at bottom */}
      <WalletConnector />
    </div>
  );
};

export default Dashboard;