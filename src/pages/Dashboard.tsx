import React, { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { HomeSection } from "@/components/sections/HomeSection";
import { MarketplaceSection } from "@/components/sections/MarketplaceSection";
import { CoursesSection } from "@/components/sections/CoursesSection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { TutorSection } from "@/components/sections/TutorSection";
import { UploadSection } from "@/components/sections/UploadSection";
import { WalletSection } from "@/components/sections/WalletSection";
import { EarnSection } from "@/components/sections/EarnSection";
import { BlogSection } from "@/components/sections/BlogSection";
import { MiniAppPrompt } from "@/components/MiniAppPrompt";
import { UniqBot } from "@/components/UniqBot";
import cubeLogo from "@/assets/uniquehub-cube.png";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { user, loading } = useAuth();

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Listen for global navigation events (e.g., after successful uploads)
  useEffect(() => {
    const handler = ((e: any) => {
      const detail = (e as CustomEvent)?.detail as { tab?: string } | undefined;
      if (detail?.tab) setActiveTab(detail.tab);
    }) as EventListener;
    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
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
        return <HomeSection onNavigate={handleTabChange} userName={user?.user_metadata?.display_name || user?.user_metadata?.username || 'Uniquebeing'} />;
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
      case "earn":
        return <EarnSection />;
      case "blog":
        return <BlogSection />;
      case "about":
        return (
          <div className="space-y-4 pb-24 animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground">About UniqueHub</h1>
            <div className="p-5 bg-card rounded-2xl border border-border space-y-4">
              <div className="space-y-3">
                <p className="text-foreground leading-relaxed text-sm">
                  UniqueHub is a super app for learning, earning, and trading, built to empower people to share knowledge and grow financially. All powered by the Base blockchain.
                </p>
                <p className="text-foreground leading-relaxed text-sm">
                  On UniqueHub, anyone can teach or learn any skill from Web3 and tech to Web2 skills, life hacks, and creative talents. It's a global hub for tutors, learners, creators, and gamers to connect, grow, and earn together.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-bold text-foreground">Our Ecosystem</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">🎓 <span className="font-semibold">Tutors:</span> share skills and earn on-chain.</p>
                  <p className="text-foreground">💰 <span className="font-semibold">Learners:</span> take courses and get rewarded for progress.</p>
                  <p className="text-foreground">🛍️ <span className="font-semibold">Creators:</span> list and sell digital products or NFTs.</p>
                  <p className="text-foreground">🎮 <span className="font-semibold">Players:</span> enjoy games like Unique Runner to earn points and redeem $UNIQ tokens.</p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-border">
                <h3 className="text-base font-bold text-foreground mb-2">Our Mission</h3>
                <p className="text-foreground text-sm leading-relaxed">
                  To make learning and earning borderless, rewarding, and accessible for everyone. Onboarding tutors, creators, and learners across the world onto Base.
                </p>
              </div>
            </div>
          </div>
        );
      case "contact":
        return (
          <div className="space-y-4 pb-24 animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground">Contact Us</h1>
            <div className="p-5 bg-card rounded-2xl border border-border space-y-4">
              <p className="text-foreground leading-relaxed text-sm">
                We'd love to hear from you! Whether you're a tutor, learner, or Web3 builder looking to collaborate, reach out to us:
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <span className="text-lg">📩</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-semibold text-foreground">support@uniquehub.xyz</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">🌐</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <p className="text-sm font-semibold text-foreground">uniquehub.xyz</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">💬</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Farcaster</p>
                    <p className="text-sm font-semibold text-foreground">@_uniquehub and @uniquebeing404</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col anime-bg-main">
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
              <HamburgerMenu onNavigate={handleTabChange} />
            </div>
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