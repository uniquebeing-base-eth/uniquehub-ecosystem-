import { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useFarcasterWallet = () => {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndConnectWallet = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch wallet from Farcaster profile
        const { data, error } = await supabase.functions.invoke('fetch-farcaster-wallet');
        
        if (error) throw error;
        
        if (data?.walletAddress) {
          setWalletAddress(data.walletAddress);
          
          // Auto-connect if not already connected
          if (!isConnected && connectors.length > 0) {
            try {
              await connectAsync({ connector: connectors[0] });
            } catch (connectError) {
              console.log('Wallet connection skipped:', connectError);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching Farcaster wallet:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndConnectWallet();
  }, [user, isConnected, connectors, connectAsync]);

  return {
    walletAddress: address || walletAddress,
    isConnected,
    isLoading,
  };
};
