
import { useMemo } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';


export const useViemClients = (address?: `0x${string}`) => {
  const publicClient = usePublicClient();
  const { data: wc } = useWalletClient();

  
  const walletClient = useMemo(() => {
    if (!address || !wc) return null;
    return wc;
  }, [address, wc]);

  return { publicClient, walletClient };
};
