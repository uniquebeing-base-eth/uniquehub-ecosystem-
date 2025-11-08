import { useEffect, useState } from "react";
import { WalletCard } from "@/components/WalletCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const WalletSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState('0.00');
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [upPoints, setUpPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchPoints();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch wallet from Farcaster via FID
      const { data, error } = await supabase.functions.invoke('fetch-farcaster-wallet');

      if (error) {
        console.error('Error fetching Farcaster wallet:', error);
        // Fallback to profile wallet_address
        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_address')
          .eq('user_id', user.id)
          .single();

        if (profile?.wallet_address) {
          setWalletAddress(profile.wallet_address);
        }
      } else if (data) {
        setWalletAddress(data.walletAddress);
        setEthBalance(data.ethBalance || '0.00');
        setUsdcBalance(data.usdcBalance || '0.00');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPoints = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUpPoints(data.total_points);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="text-center space-y-1 mb-4">
        <h2 className="text-xl font-bold">My Wallet</h2>
        <p className="text-xs text-muted-foreground">
          Manage your crypto assets
        </p>
      </div>

      {/* Wallet Address */}
      {walletAddress && (
        <Card className="p-3 bg-gradient-card">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground mb-1">Wallet Address</div>
              <div className="text-sm font-mono font-medium truncate">
                {formatAddress(walletAddress)}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => copyToClipboard(walletAddress)}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => window.open(`https://basescan.org/address/${walletAddress}`, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Balances */}
      <div className="space-y-2">
        <WalletCard type="eth" amount={ethBalance} symbol="ETH" />
        <WalletCard type="usdc" amount={usdcBalance} symbol="USDC" />
        <WalletCard type="points" amount={upPoints.toString()} symbol="UP" />
      </div>

      {/* Quick Actions */}
      <Card className="p-3">
        <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Send
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Receive
          </Button>
        </div>
      </Card>
    </div>
  );
};
