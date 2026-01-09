
import React, { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Bell, MessageSquare } from "lucide-react";
import { HomeSection } from "@/components/sections/HomeSection";
import { MissionsSection } from "@/components/sections/MissionsSection";
import { EarnSection } from "@/components/sections/EarnSection";
import { CreatorSection } from "@/components/sections/CreatorSection";
import { MarketplaceSection } from "@/components/sections/MarketplaceSection";
import { MiniAppPrompt } from "@/components/MiniAppPrompt";
import cubeLogo from "@/assets/uniquehub-cube.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const { user, loading } = useAuth();

  // Set light theme by default
  useEffect(() => {
    document.documentElement.classList.add('light');
  }, []);

  // Fetch missions completed count for creator unlock
  useEffect(() => {
    if (user) {
      fetchMissionsCompleted();
    }
  }, [user]);

  const fetchMissionsCompleted = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('module_completions')
      .select('course_id')
      .eq('user_id', user.id);
    const uniqueCourses = new Set(data?.map(c => c.course_id) || []);
    setMissionsCompleted(uniqueCourses.size);
  };
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        setTimeout(() => {
          sdk.actions.ready();
        }, 500);
      } catch (error) {
        console.log('Farcaster SDK not available');
      }
    };

    if (!loading) {
      initializeFarcaster();
    }
  }, [loading]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

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
      case "home":
        return <HomeSection onNavigate={handleTabChange} userName={user?.user_metadata?.display_name || user?.user_metadata?.username || 'User'} />;
      case "missions":
        return <MissionsSection />;
      case "earn":
        return <EarnSection />;
      case "creator":
        return <CreatorSection />;
      case "marketplace":
        return <MarketplaceSection />;
      default:
        return <HomeSection onNavigate={handleTabChange} userName={user?.user_metadata?.display_name || 'User'} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MiniAppPrompt />
      <div className="flex-1 mx-auto max-w-2xl w-full">
        {/* Header */}
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

        {/* Content */}
        <main className="px-4 py-4">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          missionsCompleted={missionsCompleted}
        />
      </div>
    </div>
  );
};

export default Dashboard;
