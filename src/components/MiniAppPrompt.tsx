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
      
      if (result?.notificationDetails) {
        console.log('Mini app added successfully!', result.notificationDetails.token);
        setShowPrompt(false);
        sessionStorage.setItem('miniapp-prompt-dismissed', 'true');
      }
    } catch (error) {
      console.error('Error adding mini app:', error);
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl animate-slide-up mb-20">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary p-3 flex items-center justify-center shadow-glow">
                <img src={cubeLogo} alt="UniqueHub" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Add UniqueHub to Farcaster</h3>
                <p className="text-sm text-muted-foreground">Get notifications and quick access</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <span className="text-lg">📱</span>
              <div>
                <p className="font-semibold text-foreground">Quick Access</p>
                <p className="text-muted-foreground text-xs">Launch UniqueHub instantly from your Farcaster app</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-lg">🔔</span>
              <div>
                <p className="font-semibold text-foreground">Get Notified</p>
                <p className="text-muted-foreground text-xs">Receive updates on courses, rewards, and new features</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-lg">🎓</span>
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
              className="flex-1"
            >
              Not now
            </Button>
            <Button
              onClick={handleAddMiniApp}
              disabled={isAdding}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
