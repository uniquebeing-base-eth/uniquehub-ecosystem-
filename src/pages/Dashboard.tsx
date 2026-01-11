
import React, { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare } from "lucide-react";
import { HomeSection } from "@/components/sections/HomeSection";
import { DiscoverSection } from "@/components/sections/DiscoverSection";
import { CoursesSection } from "@/components/sections/CoursesSection";
import { MarketplaceSection } from "@/components/sections/MarketplaceSection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { MiniAppPrompt } from "@/components/MiniAppPrompt";
import cubeLogo from "@/assets/uniquehub-cube.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, loading } = useAuth();

  // Set dark theme by default
  useEffect(() => {
    document.documentElement.classList.remove('light');
  }, []);

  // Check onboarding status
  useEffect(() => {
    if (user) {
      checkOnboarding();
    }
  }, [user]);

  const checkOnboarding = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_onboarding')
      .select('tutorial_completed, tutorial_skipped')
      .eq('user_id', user.id)
      .single();

    if (!data) {
      // Create onboarding record and show tutorial
      await supabase.from('user_onboarding').insert({ user_id: user.id });
      setShowOnboarding(true);
    } else if (!data.tutorial_completed && !data.tutorial_skipped) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = async () => {
    if (user) {
      await supabase
        .from('user_onboarding')
        .update({ tutorial_completed: true })
        .eq('user_id', user.id);
    }
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = async () => {
    if (user) {
      await supabase
        .from('user_onboarding')
        .update({ tutorial_skipped: true })
        .eq('user_id', user.id);
    }
    setShowOnboarding(false);
  };

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        setTimeout(() => sdk.actions.ready(), 500);
      } catch (error) {
        console.log('Farcaster SDK not available');
      }
    };
    if (!loading) initializeFarcaster();
  }, [loading]);

  const handleTabChange = (tab: string) => setActiveTab(tab);

  useEffect(() => {
    const handler = ((e: any) => {
      const detail = (e as CustomEvent)?.detail as { tab?: string } | undefined;
      if (detail?.tab) setActiveTab(detail.tab);
    }) as EventListener;
    
    const navigateHandler = ((e: any) => {
      const section = (e as CustomEvent)?.detail;
      if (section) setActiveTab(section);
    }) as EventListener;
    
    window.addEventListener('navigate', handler);
    window.addEventListener('navigateToSection', navigateHandler);
    return () => {
      window.removeEventListener('navigate', handler);
      window.removeEventListener('navigateToSection', navigateHandler);
    };
  }, []);

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
      case "home": return <HomeSection onNavigate={handleTabChange} />;
      case "discover": return <DiscoverSection />;
      case "courses": return <CoursesSection />;
      case "marketplace": return <MarketplaceSection />;
      case "profile": return <ProfileSection />;
      default: return <HomeSection onNavigate={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MiniAppPrompt />
      <OnboardingTutorial 
        open={showOnboarding} 
        onComplete={handleOnboardingComplete} 
        onSkip={handleOnboardingSkip} 
      />
      <div className="flex-1 mx-auto max-w-2xl w-full">
        <header className="sticky top-0 z-40 bg-card/98 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={cubeLogo} alt="UniqueHub" className="h-6 w-6" />
              <span className="text-base font-bold text-primary">UniqueHub</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-4">{renderContent()}</main>
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default Dashboard;
