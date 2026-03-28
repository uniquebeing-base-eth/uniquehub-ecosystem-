

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

const FARCASTER_CONTEXT_TIMEOUT_MS = 2500;

export const PlatformGuard = ({ children }: { children: React.ReactNode }) => {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkPlatformContext = async () => {
      try {
        await Promise.race([
          sdk.context,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Farcaster context timeout')), FARCASTER_CONTEXT_TIMEOUT_MS)
          ),
        ]);
      } catch (error) {
        console.warn('Platform context check skipped:', error);
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    void checkPlatformContext();

    return () => {
      cancelled = true;
    };
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

  return <>{children}</>;
};
