import React, { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HomeSection } from "@/components/sections/HomeSection";
import { MarketplaceSection } from "@/components/sections/MarketplaceSection";
import { CoursesSection } from "@/components/sections/CoursesSection";
import { EarningSection } from "@/components/sections/EarningSection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { TutorSection } from "@/components/sections/TutorSection";

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
        return <HomeSection onNavigate={handleTabChange} />;
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
        {/* Header with Logo and Profile */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-3">
            <img 
              src={new URL('../assets/uniquehub-logo.png', import.meta.url).href} 
              alt="UniqueHub" 
              className="w-10 h-10"
            />
            <h1 className="text-2xl font-bold text-primary">UniqueHub</h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.display_name || 'User'} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                  {(user.user_metadata?.display_name || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* Navigation - Always visible */}
        <div className="flex justify-center mb-8">
          <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;