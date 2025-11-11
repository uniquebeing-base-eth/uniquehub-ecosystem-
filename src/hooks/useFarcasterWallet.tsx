import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFarcasterWallet = () => {
  const { user } = useAuth();
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setAddress(undefined);
      return;
    }

    const fetchWallet = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke('fetch-farcaster-wallet');
        
        if (error) {
          console.error('Error fetching wallet:', error);
          return;
        }

        if (data?.walletAddress) {
          setAddress(data.walletAddress as `0x${string}`);
        }
      } catch (error) {
        console.error('Failed to fetch wallet:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallet();
  }, [user]);

  return {
    address,
    isConnected: !!address,
    isLoading,
  };
};
