import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { MiniAppPrompt } from "@/components/MiniAppPrompt";
import { UniqBot } from "@/components/UniqBot";
import { AuthPage } from "@/components/AuthPage";
import { PWAInstall } from "@/components/PWAInstall";
import cubeLogo from "@/assets/uniquehub-cube.png";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };
  

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

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Listen for global navigation events
  useEffect(() => {
    const handler = ((e: any) => {
      const detail = (e as CustomEvent)?.detail as { tab?: string } | undefined;
      if (detail?.tab) {
        const pathMap: Record<string, string> = {
          home: '/',
          earn: '/earn',
          marketplace: '/marketplace',
          courses: '/courses',
          quest: '/quest',
          nft: '/nft',
          profile: '/profile',
          tutor: '/tutor',
          upload: '/upload',
          wallet: '/wallet',
          blog: '/blog',
          certificates: '/certificates',
          leaderboard: '/leaderboard',
          about: '/about',
          contact: '/contact',
        };
        navigate(pathMap[detail.tab] || '/');
      }
    }) as EventListener;
    
    const navigateHandler = ((e: any) => {
      const section = (e as CustomEvent)?.detail;
      if (section) {
        const pathMap: Record<string, string> = {
          home: '/',
          earn: '/earn',
          marketplace: '/marketplace',
          courses: '/courses',
          quest: '/quest',
          nft: '/nft',
          profile: '/profile',
          tutor: '/tutor',
          upload: '/upload',
          wallet: '/wallet',
          blog: '/blog',
          certificates: '/certificates',
          leaderboard: '/leaderboard',
          about: '/about',
          contact: '/contact',
        };
        navigate(pathMap[section] || '/');
      }
    }) as EventListener;
    
    window.addEventListener('navigate', handler);
    window.addEventListener('navigateToSection', navigateHandler);
    
    return () => {
      window.removeEventListener('navigate', handler);
      window.removeEventListener('navigateToSection', navigateHandler);
    };
  }, [navigate]);

  // Show auth page if not signed in
  if (!user) {
    return <AuthPage />;
  }

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


  return (
    <div className="min-h-screen flex flex-col anime-bg-main">
      <PWAInstall />
      <MiniAppPrompt />
      <UniqBot />
      <div className="flex-1 mx-auto max-w-2xl w-full">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-3 py-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-white text-xs font-semibold">
                  {(user?.user_metadata?.display_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex items-center gap-1.5">
              <img src={cubeLogo} alt="UniqueHub" className="h-5 w-5" />
              <span className="text-sm font-bold text-foreground">UniqueHUB</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0 hover:scale-110 transition-transform active:scale-95"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <HamburgerMenu onNavigate={handleNavigation} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-6">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
};

export default Dashboard;