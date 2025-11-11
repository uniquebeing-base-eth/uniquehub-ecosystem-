import { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFarcasterWallet = () => {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  useEffect(() => {
    if (!isConnected && user) {
      // Auto-connect to Farcaster wallet
      connect({ connector: injected() });
    }
  }, [isConnected, user, connect]);

  return {
    address,
    isConnected,
  };
};
