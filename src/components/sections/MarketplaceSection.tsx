import { NFTCard } from "@/components/NFTCard";

export const MarketplaceSection = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
      <div className="grid grid-cols-2 gap-6">
        <NFTCard
          title="Penguin Avatar"
          price="5.00"
          currency="USDC"
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
        />
        <NFTCard
          title="Digital Coin"
          price="10.00"
          currency="USDC"
          gradient="bg-gradient-to-br from-primary to-primary-glow"
        />
        <NFTCard
          title="Abstract Art"
          price="3.50"
          currency="USDC"
          gradient="bg-gradient-to-br from-success to-primary"
        />
        <NFTCard
          title="Rocket"
          price="7.00"
          currency="USDC"
          gradient="bg-gradient-to-br from-blue-600 to-purple-600"
        />
      </div>
    </div>
  );
};