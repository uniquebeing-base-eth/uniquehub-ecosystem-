import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFarcasterWallet = () => {
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [ethBalance, setEthBalance] = useState<string>('0.00');
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [fid, setFid] = useState<number | undefined>();

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
        
        // Get FID from Farcaster context
        let fcFid: number | undefined;
        try {
          const mod = await import('@farcaster/miniapp-sdk');
          const context = await mod?.sdk?.context;
          fcFid = context?.user?.fid;
          if (!cancelled && fcFid) setFid(fcFid);
        } catch {}

        // Fetch wallet data from Neynar via FID (no auth required)
        if (fcFid) {
          const { data, error } = await supabase.functions.invoke('fetch-farcaster-wallet', {
            body: { fid: fcFid }
          });
          if (!cancelled && data?.walletAddress) {
            setAddress(data.walletAddress as `0x${string}`);
            setEthBalance(data.ethBalance || '0.00');
            setUsdcBalance(data.usdcBalance || '0.00');
            // Also try to get provider for signing
            await fromProvider();
            return;
          }
          if (error) console.error('Error fetching wallet via FID:', error);
        }

        // Fallback to provider detection
        await fromProvider();
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
  }, []);

  return {
    address,
    ethBalance,
    usdcBalance,
    fid,
    isConnected: !!address,
    isLoading,
  };
};
