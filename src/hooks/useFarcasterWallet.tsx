import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFarcasterWallet = () => {
  const { user } = useAuth();
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fromProvider = async () => {
      try {
        const eth = (window as any)?.ethereum;
        if (!eth) return;
        // Try silent accounts fetch first
        const accounts: string[] = await eth.request?.({ method: 'eth_accounts' });
        if (accounts && accounts[0]) {
          if (!cancelled) setAddress(accounts[0] as `0x${string}`);
          return;
        }
        // As fallback, request accounts (may show prompt inside mini app)
        const reqAccounts: string[] = await eth.request?.({ method: 'eth_requestAccounts' });
        if (reqAccounts && reqAccounts[0] && !cancelled) {
          setAddress(reqAccounts[0] as `0x${string}`);
        }
      } catch (e) {
        console.warn('Provider accounts fetch failed:', e);
      }
    };

    const fetchWallet = async () => {
      if (!user) { setAddress(undefined); return; }
      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke('fetch-farcaster-wallet');
        if (!cancelled && data?.walletAddress) {
          setAddress(data.walletAddress as `0x${string}`);
          return;
        }
        if (error) console.error('Error fetching wallet:', error);
        // Fallback to provider if edge function didn't return address
        await fromProvider();
      } catch (error) {
        console.error('Failed to fetch wallet:', error);
        await fromProvider();
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
