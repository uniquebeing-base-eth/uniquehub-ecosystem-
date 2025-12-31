
import { BottomNavigation } from "@/components/BottomNavigation";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { NFTSection } from "@/components/sections/NFTSection";
import { MiniAppPrompt } from "@/components/MiniAppPrompt";
import { UniqBot } from "@/components/UniqBot";
import cubeLogo from "@/assets/uniquehub-cube.png";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";


const NFTs = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  
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
    navigate(tab === 'home' ? '/' : `/${tab}`);
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

  return (
    <div className={`min-h-screen bg-background transition-colors duration-300 ${theme}`}>
      <Helmet>
        <title>Unique NFTs - UniqueHub</title>
        <meta name="description" content="Generate your own unique Avatar NFT on UniqueHub" />
        <meta property="og:title" content="Unique NFTs - UniqueHub" />
        <meta property="og:description" content="Generate your own unique Avatar NFT on UniqueHub" />
        <meta property="og:image" content="https://uniquehub.xyz/opengraph-image.png" />
        <meta property="og:url" content="https://uniquehub.xyz/nfts" />
        
        {/* Farcaster Mini App Meta */}
        <meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://uniquehub.xyz/opengraph-image.png","button":{"title":"Launch UniqueHub NFTs","action":{"type":"launch_miniapp","name":"UniqueHub NFTs","url":"https://uniquehub.xyz/nfts","splashImageUrl":"https://uniquehub.xyz/opengraph-image.png","splashBackgroundColor":"#1a4d8f"}}}' />
        <meta name="fc:frame" content='{"version":"1","imageUrl":"https://uniquehub.xyz/opengraph-image.png","button":{"title":"Launch UniqueHub NFTs","action":{"type":"launch_miniapp","name":"UniqueHub NFTs","url":"https://uniquehub.xyz/nfts","splashImageUrl":"https://uniquehub.xyz/opengraph-image.png","splashBackgroundColor":"#1a4d8f"}}}' />
      </Helmet>
      
      <MiniAppPrompt />
      
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={cubeLogo} 
              alt="UniqueHub" 
              className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              UniqueHub
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <HamburgerMenu onNavigate={handleTabChange} />

            {user && (
              <Avatar className="h-8 w-8 border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {(user.user_metadata?.display_name || user.user_metadata?.username || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <NFTSection />
      </main>

      <UniqBot />
      <BottomNavigation activeTab="nfts" onTabChange={handleTabChange} />
    </div>
  );
};

export default NFTs;
