import { WalletCard } from "@/components/WalletCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFarcasterWallet } from "@/hooks/useFarcasterWallet";
import { useBalance } from "wagmi";
import { formatUnits } from "viem";
import { base } from "wagmi/chains";

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

export const WalletSection = () => {
  const { toast } = useToast();
  const { address, isLoading } = useFarcasterWallet();

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

  const ethBalance = ethBalanceData 
    ? parseFloat(formatUnits(ethBalanceData.value, ethBalanceData.decimals)).toFixed(4)
    : '0.00';

  const usdcBalance = usdcBalanceData
    ? parseFloat(formatUnits(usdcBalanceData.value, usdcBalanceData.decimals)).toFixed(2)
    : '0.00';


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
      {address && (
        <Card className="p-3 bg-gradient-card">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground mb-1">Wallet Address</div>
              <div className="text-sm font-mono font-medium truncate">
                {formatAddress(address)}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => copyToClipboard(address)}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => window.open(`https://basescan.org/address/${address}`, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Balances */}
      <div className="space-y-2">
        <WalletCard type="uniq" amount="Coming Soon" symbol="UNIQ" />
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
