
import { useEffect, useState } from "react";
import { WalletCard } from "@/components/WalletCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFarcasterWallet } from "@/hooks/useFarcasterWallet";
import { useBalance } from "wagmi";
import { formatUnits } from "viem";
import { base } from "wagmi/chains";
import { supabase } from "@/integrations/supabase/client";


const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;


export const WalletSection = () => {
  const { toast } = useToast();
  const { address, isLoading } = useFarcasterWallet();
  const [serverAddress, setServerAddress] = useState<string | undefined>();
  const [serverEth, setServerEth] = useState<string | undefined>();
  const [serverUsdc, setServerUsdc] = useState<string | undefined>();
  // Fetch ETH balance
  const { data: ethBalanceData } = useBalance({
    address,
    chainId: base.id,
  });
  // Fetch USDC balance
  const { data: usdcBalanceData } = useBalance({
    address,
    token: USDC_ADDRESS,
    chainId: base.id,
  });

  // Also fetch balances via Neynar/Alchemy edge function as a reliable fallback
  useEffect(() => {
    const run = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-farcaster-balances');
        if (!error && data) {
          if (data.address) setServerAddress(data.address as string);
          if (data.eth?.formatted) setServerEth(String(data.eth.formatted));
          if (data.usdc?.formatted) setServerUsdc(String(data.usdc.formatted));
        }
      } catch {}
    };
    run();
  }, [address]);

  const ethBalance = ethBalanceData 
    ? parseFloat(formatUnits(ethBalanceData.value, ethBalanceData.decimals)).toFixed(4)
    : serverEth ?? '0.0000';

  const usdcBalance = usdcBalanceData
    ? parseFloat(formatUnits(usdcBalanceData.value, usdcBalanceData.decimals)).toFixed(2)
    : serverUsdc ?? '0.00';

  // Calculate total balance (ETH at ~$2500 + USDC)
  const ethValue = parseFloat(ethBalance) * 2500;
  const usdcValue = parseFloat(usdcBalance);
  const totalBalance = (ethValue + usdcValue).toFixed(2);


  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      });
    } catch (e) {
      toast({
        title: "Copy failed",
        description: "Could not copy address. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const displayAddress = (address ?? serverAddress) as string | undefined;

  return (
    <div className="space-y-4 pb-20">
      {/* Total Balance Header */}
      <div className="text-center space-y-1 mb-4">
        <div className="text-3xl font-bold text-foreground">${totalBalance}</div>
        <div className="text-sm text-muted-foreground">
          {ethBalance} ETH + {usdcBalance} USDC
        </div>
      </div>

      {/* Wallet Address */}
      {displayAddress && (
        <Card className="p-3 bg-gradient-card">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground mb-1">Wallet Address</div>
              <div
                className="text-sm font-mono font-medium truncate cursor-pointer"
                onClick={() => copyToClipboard(displayAddress)}
                title="Click to copy full address"
              >
                {formatAddress(displayAddress)}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => copyToClipboard(displayAddress)}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => window.open(`https://basescan.org/address/${displayAddress}`, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Individual Balances */}
      <div className="space-y-2">
        <WalletCard type="eth" amount={ethBalance} symbol="ETH" />
        <WalletCard type="usdc" amount={usdcBalance} symbol="USDC" />
      </div>

      {/* Quick Actions - Blurred Coming Soon */}
      <Card className="p-3 relative">
        <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2 blur-sm pointer-events-none">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Send
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Receive
          </Button>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary bg-card/80 px-4 py-2 rounded-full border border-primary/50">
            Coming Soon
          </span>
        </div>
      </Card>
    </div>
  );
};
