import { WalletCard } from "@/components/WalletCard";

export const WalletSection = () => {
  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold">My Wallet</h2>
        <p className="text-muted-foreground">
          Manage your crypto assets
        </p>
      </div>

      <div className="space-y-4">
        <WalletCard type="usdc" amount="0" symbol="USDC" />
        <WalletCard type="eth" amount="0" symbol="ETH" />
        <WalletCard type="points" amount="0" symbol="UP" />
      </div>
    </div>
  );
};
