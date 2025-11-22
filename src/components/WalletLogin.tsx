import { useState } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export const WalletLogin = () => {
  const { connectors, connectAsync } = useConnect();
  const { isConnected } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (connector: any) => {
    try {
      setIsConnecting(true);
      await connectAsync({ connector });
      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(error?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected) {
    return null;
  }

  const getConnectorName = (connector: any) => {
    if (connector.name.toLowerCase().includes('farcaster')) return 'Farcaster';
    if (connector.name.toLowerCase().includes('walletconnect')) return 'WalletConnect';
    if (connector.name.toLowerCase().includes('coinbase')) return 'Coinbase Wallet';
    return connector.name;
  };

  const getConnectorIcon = (connector: any) => {
    const name = connector.name.toLowerCase();
    if (name.includes('farcaster')) return '🎭';
    if (name.includes('walletconnect')) return '🔗';
    if (name.includes('coinbase')) return '🔵';
    return '🔐';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 bg-card/95 backdrop-blur-sm border-primary/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to UniqueHub</h1>
          <p className="text-muted-foreground">
            Connect your wallet to access Web3 learning and trading
          </p>
        </div>

        <div className="space-y-3">
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              disabled={isConnecting}
              variant="outline"
              size="lg"
              className="w-full justify-start text-left h-auto py-4 hover:bg-primary/10 hover:border-primary/50 transition-all"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <span className="text-2xl mr-3">{getConnectorIcon(connector)}</span>
              )}
              <div>
                <div className="font-semibold">{getConnectorName(connector)}</div>
                <div className="text-xs text-muted-foreground">
                  {connector.name.toLowerCase().includes('farcaster') && 'Sign in with your Farcaster account'}
                  {connector.name.toLowerCase().includes('walletconnect') && 'Connect with any wallet'}
                  {connector.name.toLowerCase().includes('coinbase') && 'Use Coinbase Wallet'}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>By connecting, you agree to our Terms of Service</p>
        </div>
      </Card>
    </div>
  );
};
