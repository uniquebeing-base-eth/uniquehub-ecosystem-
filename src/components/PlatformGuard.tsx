

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export const PlatformGuard = ({ children }: { children: React.ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPlatformContext = async () => {
      try {
        // Check if running in Farcaster mini app context
        const context = await sdk.context;
        
        if (context?.client?.clientFid) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        // Not in Farcaster/Base context
        setIsAuthorized(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPlatformContext();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            UniqueHub is only accessible through Farcaster or Base mini apps. 
            Please open this application from within the Farcaster or Base ecosystem.
          </p>
          <div className="bg-muted p-4 rounded-lg mb-6">
            <p className="text-sm">
              Find us on <span className="font-semibold">Farcaster</span> or <span className="font-semibold">Base</span> to get started.
            </p>
          </div>
          <Button
            onClick={() => window.open('https://farcaster.xyz/miniapps/lQoakVUKSjUV/uniquehub', '_blank')}
            className="w-full"
            size="lg"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Open Farcaster
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
