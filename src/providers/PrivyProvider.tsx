import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import { ReactNode } from 'react';

// Privy App ID from environment
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

interface PrivyProviderProps {
  children: ReactNode;
}

export const PrivyProvider = ({ children }: PrivyProviderProps) => {
  if (!PRIVY_APP_ID) {
    console.warn('VITE_PRIVY_APP_ID is not set');
    return <>{children}</>;
  }

  return (
    <PrivyProviderBase
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['wallet', 'email', 'farcaster', 'twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#3b82f6',
          logo: 'https://uniquehub.xyz/icon.png',
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: {
          id: 8453,
          name: 'Base',
          network: 'base',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ['https://mainnet.base.org'],
            },
          },
          blockExplorers: {
            default: {
              name: 'Basescan',
              url: 'https://basescan.org',
            },
          },
        },
        supportedChains: [
          {
            id: 8453,
            name: 'Base',
            network: 'base',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://mainnet.base.org'],
              },
            },
            blockExplorers: {
              default: {
                name: 'Basescan',
                url: 'https://basescan.org',
              },
            },
          },
          {
            id: 42161,
            name: 'Arbitrum One',
            network: 'arbitrum',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://arb1.arbitrum.io/rpc'],
              },
            },
            blockExplorers: {
              default: {
                name: 'Arbiscan',
                url: 'https://arbiscan.io',
              },
            },
          },
          {
            id: 56,
            name: 'BNB Smart Chain',
            network: 'bsc',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://bsc-dataseed.binance.org'],
              },
            },
            blockExplorers: {
              default: {
                name: 'BscScan',
                url: 'https://bscscan.com',
              },
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProviderBase>
  );
};
