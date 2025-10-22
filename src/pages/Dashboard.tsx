import React, { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HomeSection } from "@/components/sections/HomeSection";
import { MarketplaceSection } from "@/components/sections/MarketplaceSection";
import { CoursesSection } from "@/components/sections/CoursesSection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { TutorSection } from "@/components/sections/TutorSection";
import { UploadSection } from "@/components/sections/UploadSection";
import { WalletSection } from "@/components/sections/WalletSection";
import logoImage from "@/assets/uniquehub-logo.png";

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
      case "upload":
        return <UploadSection />;
      case "profile":
        return <ProfileSection />;
      case "tutor":
        return <TutorSection />;
      case "wallet":
        return <WalletSection />;
      case "about":
        return (
          <div className="space-y-4 pb-24">
            <h2 className="text-2xl font-bold">About UniqueHub</h2>
            <p className="text-muted-foreground">
              UniqueHub is your super app for learning, earning, and trading in the Web3 space.
            </p>
          </div>
        );
      case "contact":
        return (
          <div className="space-y-4 pb-24">
            <h2 className="text-2xl font-bold">Contact Us</h2>
            <p className="text-muted-foreground">
              Get in touch with us for support and inquiries.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col anime-bg-main">
      <div className="flex-1 mx-auto max-w-2xl w-full">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logoImage} 
                alt="UniqueHub" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="text-sm font-bold text-primary">
                  Hi {user?.user_metadata?.display_name || 'Uniquebeing'}
                </h1>
              </div>
            </div>
            <HamburgerMenu onNavigate={handleTabChange} />
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-6">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default Dashboard;