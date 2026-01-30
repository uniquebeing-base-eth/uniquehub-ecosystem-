

import { DollarSign, Star } from 'lucide-react';



interface WalletCardProps {
  type: 'usdc' | 'eth' | 'uniq';
  amount: string;
  symbol: string;
}

export const WalletCard = ({ type, amount, symbol }: WalletCardProps) => {
  const getIcon = () => {
    switch (type) {
      case 'usdc':
        return <DollarSign className="w-6 h-6 text-crypto-usdc" />;
      case 'eth':
        return <div className="w-6 h-6 bg-crypto-eth rounded-full flex items-center justify-center text-xs font-bold text-background">Ξ</div>;
      case 'uniq':
        return <Star className="w-6 h-6 text-primary" fill="currentColor" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-card rounded-xl p-4 shadow-card border border-border hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center gap-3">
        {getIcon()}
        <div>
          <div className="text-lg font-bold text-foreground">{amount}</div>
          <div className="text-sm text-muted-foreground">{symbol}</div>
        </div>
      </div>
    </div>
  );
};
