import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

export const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error('Installation not available');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success('App installed successfully!');
    }

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-card border border-primary/20 rounded-lg p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Install UniqueHub</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Install our app for quick access and offline use
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
              <Button 
                onClick={() => setShowInstall(false)} 
                variant="outline" 
                size="sm"
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={() => setShowInstall(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
