import { useMemo } from 'react';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { base } from 'viem/chains';

export const useViemClients = (address?: `0x${string}`) => {
  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: base,
      transport: http(),
    });
  }, []);

  const walletClient = useMemo(() => {
    if (!address) return null;
    
    // Use Farcaster provider if available, fallback to window.ethereum
    const provider = (window as any).__fcProvider || (window as any).ethereum;
    if (typeof window === 'undefined' || !provider) return null;

    return createWalletClient({
      account: address,
      chain: base,
      transport: custom(provider),
    });
  }, [address]);

  return { publicClient, walletClient };
};
