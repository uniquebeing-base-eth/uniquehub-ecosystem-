import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFarcasterWallet = () => {
  const { user } = useAuth();
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fromProvider = async (): Promise<boolean> => {
      try {
        // Prefer Farcaster Mini App provider if available
        let eth: any = undefined;
        try {
          const mod = await import('@farcaster/miniapp-sdk');
          eth = mod?.sdk?.wallet?.getEthereumProvider?.();
        } catch {}
        if (!eth) eth = (window as any)?.ethereum;
        if (!eth) return false;
        // Save provider globally for viem wallet client
        (window as any).__fcProvider = eth;
        // Try silent accounts fetch first
        const accounts: string[] = await eth.request?.({ method: 'eth_accounts' });
        if (accounts && accounts[0]) {
          if (!cancelled) setAddress(accounts[0] as `0x${string}`);
          return true;
        }
        // As fallback, request accounts (may show prompt inside mini app)
        const reqAccounts: string[] = await eth.request?.({ method: 'eth_requestAccounts' });
        if (reqAccounts && reqAccounts[0]) {
          if (!cancelled) setAddress(reqAccounts[0] as `0x${string}`);
          return true;
        }
      } catch (e) {
        console.warn('Provider accounts fetch failed:', e);
      }
      return false;
    };

    const fetchWallet = async () => {
      try {
        setIsLoading(true);
        // Try provider first (works inside Farcaster Mini App without Supabase auth)
        const gotFromProvider = await fromProvider();
        if (gotFromProvider) return;

        // If not found via provider, try fetching via edge function when logged in
        if (user) {
          const { data, error } = await supabase.functions.invoke('fetch-farcaster-wallet');
          if (!cancelled && data?.walletAddress) {
            setAddress(data.walletAddress as `0x${string}`);
            return;
          }
          if (error) console.error('Error fetching wallet:', error);
        }
      } catch (error) {
        console.error('Failed to fetch wallet:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchWallet();

    // Listen for account changes
    const eth = (window as any)?.ethereum;
    const onAccountsChanged = (accounts: string[]) => {
      if (!cancelled) setAddress((accounts?.[0] as `0x${string}`) || undefined);
    };
    eth?.on?.('accountsChanged', onAccountsChanged);

    return () => {
      cancelled = true;
      eth?.removeListener?.('accountsChanged', onAccountsChanged);
    };
  }, [user]);

  return {
    address,
    isConnected: !!address,
    isLoading,
  };
};
