

import { useEffect, useRef, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';


export const useFarcasterWallet = () => {
  const { user } = useAuth();
  const { address: wagmiAddress, status, isConnected } = useAccount();
  const { connectAsync, connectors, status: connectStatus } = useConnect();
  const [fallbackAddress, setFallbackAddress] = useState<`0x${string}` | undefined>();
  const attemptedRef = useRef(false);

  
  // Try to auto-connect to Farcaster Mini App connector once
  useEffect(() => {
    if (attemptedRef.current) return;
    if (status === 'disconnected') {
      const fc = connectors.find(
        (c) => (c as any).id === 'farcasterMiniApp' || c.name.toLowerCase().includes('farcaster')
      );
      if (fc) {
        attemptedRef.current = true;
        void connectAsync({ connector: fc }).catch(() => {
          // Not in Farcaster environment or user rejected - ignore silently
        });
      }
    }
  }, [status, connectors, connectAsync]);

  // Fallback: if no connected address but user exists, fetch from edge function for display-only
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (wagmiAddress || !user) return;
      try {
        const { data, error } = await supabase.functions.invoke('fetch-farcaster-wallet');
        if (!cancelled && data?.walletAddress && !error) {
          setFallbackAddress(data.walletAddress as `0x${string}`);
        }
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [wagmiAddress, user]);

  const address = wagmiAddress ?? fallbackAddress;
  const isLoading = status === 'connecting' || connectStatus === 'pending';

  return {
    address,
    isConnected: !!wagmiAddress,
    isLoading,
  };
};
