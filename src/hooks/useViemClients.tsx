import { useMemo } from 'react';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { base } from 'viem/chains';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useViemClients = (address?: `0x${string}`) => {
  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: base,
      transport: http(),
    });
  }, []);

  const walletClient = useMemo(() => {
    if (!address || typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    return createWalletClient({
      account: address,
      chain: base,
      transport: custom(window.ethereum),
    });
  }, [address]);

  return { publicClient, walletClient };
};
