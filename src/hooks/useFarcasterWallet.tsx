
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
  const sdkAttemptedRef = useRef(false);

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

  // Fallback: try Farcaster SDK directly for wallet address
  useEffect(() => {
    if (wagmiAddress || sdkAttemptedRef.current) return;
    sdkAttemptedRef.current = true;
    
    const tryFarcasterSdk = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const context = await sdk.context;
        if (context?.user?.fid) {
          // We have FID, can use it for profile data even without wallet
          console.log('Farcaster SDK context available, FID:', context.user.fid);
        }
      } catch {
        // Not in Farcaster context
      }
    };
    tryFarcasterSdk();
  }, [wagmiAddress]);

  // Fallback: if no connected address but user exists, fetch from edge function
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (wagmiAddress || !user) return;
      
      // Try edge function first (Neynar), then fall back to profile data
      try {
        const { data, error } = await supabase.functions.invoke('fetch-farcaster-wallet');
        if (!cancelled && data?.walletAddress && !error) {
          setFallbackAddress(data.walletAddress as `0x${string}`);
          return;
        }
      } catch {
        // Neynar failed, try profile fallback
      }

      // Fallback: check profile for stored wallet address
      if (!cancelled && user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('wallet_address')
            .eq('user_id', user.id)
            .single();
          
          if (!cancelled && profile?.wallet_address) {
            setFallbackAddress(profile.wallet_address as `0x${string}`);
          }
        } catch {
          // ignore
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [wagmiAddress, user]);

  const address = wagmiAddress ?? fallbackAddress;
  const isLoading = status === 'connecting' || connectStatus === 'pending';

  return {
    address,
    isConnected: !!wagmiAddress,
    isLoading,
  };
};
