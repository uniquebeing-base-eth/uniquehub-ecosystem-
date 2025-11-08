import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import cubeLogo from '@/assets/uniquehub-cube.png';

export const MiniAppPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        setIsSDKLoaded(true);
        
        // Check if user has already dismissed the prompt in this session
        const dismissed = sessionStorage.getItem('miniapp-prompt-dismissed');
        if (!dismissed) {
          // Show prompt after a short delay for better UX
          setTimeout(() => {
            setShowPrompt(true);
          }, 2000);
        }
      } catch (error) {
        console.log('Farcaster SDK not available');
      }
    };

    initializeSDK();
  }, []);

  const handleAddMiniApp = async () => {
    if (!isSDKLoaded) return;
    
    setIsAdding(true);
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      const result = await sdk.actions.addFrame();
      
      console.log('Mini app add result:', result);
      
      // Always close the prompt after the add action completes
      setShowPrompt(false);
      sessionStorage.setItem('miniapp-prompt-dismissed', 'true');
      
      if (result?.notificationDetails) {
        console.log('Mini app added with notifications enabled!', result.notificationDetails.token);
        // Send notification token to backend for storage
        try {
          const response = await fetch('https://ucqcrhfcflrepsdlcvpq.supabase.co/functions/v1/miniapp-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'miniapp.added',
              data: {
                notificationDetails: result.notificationDetails
              }
            })
          });
          console.log('Notification token sent to backend:', await response.json());
        } catch (backendError) {
          console.error('Failed to send notification token:', backendError);
        }
      }
    } catch (error) {
      console.error('Error adding mini app:', error);
      setShowPrompt(false);
      sessionStorage.setItem('miniapp-prompt-dismissed', 'true');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('miniapp-prompt-dismissed', 'true');
  };

  if (!showPrompt || !isSDKLoaded) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-gradient-to-b from-black/60 via-purple-900/30 to-blue-900/30 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-md bg-gradient-to-br from-card/95 via-card/98 to-primary/5 border-2 border-primary/20 shadow-[0_0_40px_rgba(59,130,246,0.3)] animate-scale-in mb-20 overflow-hidden relative">
        {/* Anime-style sparkle effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <CardContent className="p-6 space-y-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary p-3 flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.5)] ring-2 ring-primary/30 animate-pulse">
                <img src={cubeLogo} alt="UniqueHub" className="w-full h-full object-contain drop-shadow-glow" />
              </div>
              <div>
                <h3 className="font-bold text-lg bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent animate-pulse">
                  Add UniqueHub to Farcaster ✨
                </h3>
                <p className="text-sm text-muted-foreground">Get notifications and quick access</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 -mt-1 -mr-1 hover:bg-primary/10 hover:text-primary transition-all"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 bg-background/40 backdrop-blur-sm rounded-xl p-4 border border-primary/10">
            <div className="flex items-start gap-3 text-sm group hover:scale-105 transition-transform">
              <span className="text-2xl group-hover:scale-110 transition-transform">📱</span>
              <div>
                <p className="font-semibold text-foreground">Quick Access</p>
                <p className="text-muted-foreground text-xs">Launch UniqueHub instantly from your Farcaster app</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm group hover:scale-105 transition-transform">
              <span className="text-2xl group-hover:scale-110 transition-transform">🔔</span>
              <div>
                <p className="font-semibold text-foreground">Get Notified</p>
                <p className="text-muted-foreground text-xs">Receive updates on courses, rewards, and new features</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm group hover:scale-105 transition-transform">
              <span className="text-2xl group-hover:scale-110 transition-transform">🎓</span>
              <div>
                <p className="font-semibold text-foreground">Never Miss Out</p>
                <p className="text-muted-foreground text-xs">Stay updated on new courses and marketplace items</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              Not now
            </Button>
            <Button
              onClick={handleAddMiniApp}
              disabled={isAdding}
              className="flex-1 bg-gradient-primary hover:opacity-90 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all hover:scale-105"
            >
              {isAdding ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                '✨ Add Now'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
