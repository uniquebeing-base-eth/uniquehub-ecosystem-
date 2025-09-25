import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const FarcasterAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { signInWithFarcaster } = useAuth();

  const connectFarcaster = async () => {
    setIsConnecting(true);
    try {
      // Simulate Farcaster connection - in real app this would use @farcaster/auth-kit
      const mockFarcasterData = {
        fid: Math.floor(Math.random() * 100000),
        username: 'user' + Math.floor(Math.random() * 1000),
        displayName: 'Farcaster User',
        custodyAddress: '0x' + Math.random().toString(16).substr(2, 40),
        signature: 'mock_signature_' + Date.now(),
      };

      await signInWithFarcaster(mockFarcasterData);
    } catch (error) {
      console.error('Failed to connect Farcaster:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
          <Wallet className="w-8 h-8 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Connect with Farcaster</h2>
          <p className="text-muted-foreground">
            Sign in with your Farcaster account to access UniqueHub
          </p>
        </div>
        <Button
          onClick={connectFarcaster}
          disabled={isConnecting}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Farcaster
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};