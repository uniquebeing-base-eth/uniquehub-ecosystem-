import React, { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { HomeSection } from "@/components/sections/HomeSection";
import { MarketplaceSection } from "@/components/sections/MarketplaceSection";
import { CoursesSection } from "@/components/sections/CoursesSection";
import { EarningSection } from "@/components/sections/EarningSection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { TutorSection } from "@/components/sections/TutorSection";
import { WalletConnector } from "@/components/WalletConnector";

import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const { user, loading } = useAuth();
  

  // Initialize Farcaster SDK when component mounts
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        // Wait a bit for auth to complete before calling ready
        setTimeout(() => {
          sdk.actions.ready();
        }, 500);
      } catch (error) {
        // SDK not available or not in Farcaster context, continue normally
        console.log('Farcaster SDK not available');
      }
    };

    // Only initialize once user is loaded
    if (!loading) {
      initializeFarcaster();
    }
  }, [loading]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
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
    <div className="min-h-screen flex flex-col anime-bg-main">
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