
import { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, TrendingUp, ArrowRightLeft, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';
import cubeLogo from '@/assets/uniquehub-cube.png';

interface TokenInfo {
  id: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  change24h: number;
  totalSupply: number;
  circulatingSupply: number;
  holdersCount?: number;
  iconUrl?: string;
  type: 'creator' | 'course' | 'platform';
}

interface TokenDetailModalProps {
  open: boolean;
  onClose: () => void;
  token: TokenInfo | null;
  usdcBalance: number;
  ethBalance: number;
  onBuy: (tokenId: string, amount: number, paymentType: 'usdc' | 'eth') => Promise<boolean>;
  onSwap: (fromToken: string, toToken: string, amount: number) => Promise<boolean>;
}

// Generate realistic price chart data
const generateChartData = (currentPrice: number, change: number) => {
  const data = [];
  const basePrice = currentPrice / (1 + change / 100);
  const volatility = 0.03;
  let price = basePrice;
  
  for (let i = 0; i < 24; i++) {
    const trend = (change / 100) / 24;
    const noise = (Math.random() - 0.5) * volatility;
    price = price * (1 + trend + noise);
    data.push({
      time: `${i}:00`,
      price: Math.max(0.0001, price),
    });
  }
  
  // Ensure last price matches current
  data[data.length - 1].price = currentPrice;
  return data;
};

export const TokenDetailModal = ({
  open,
  onClose,
  token,
  usdcBalance,
  ethBalance,
  onBuy,
  onSwap,
}: TokenDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'swap'>('buy');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'usdc' | 'eth'>('usdc');
  const [swapFromToken, setSwapFromToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const chartData = useMemo(() => {
    if (!token) return [];
    return generateChartData(token.price, token.change24h);
  }, [token]);

  const tokensToReceive = useMemo(() => {
    if (!amount || !token) return 0;
    const inputAmount = parseFloat(amount);
    if (isNaN(inputAmount)) return 0;
    
    // Calculate tokens based on payment type
    const usdValue = paymentType === 'eth' ? inputAmount * 2500 : inputAmount;
    return usdValue / token.price;
  }, [amount, token, paymentType]);

  const handleBuy = async () => {
    if (!token || !amount) return;
    
    const inputAmount = parseFloat(amount);
    if (isNaN(inputAmount) || inputAmount <= 0) return;

    // Check balance
    if (paymentType === 'usdc' && inputAmount > usdcBalance) return;
    if (paymentType === 'eth' && inputAmount > ethBalance) return;

    setShowConfirmation(true);
  };

  const confirmTransaction = async () => {
    if (!token || !amount) return;
    
    setIsProcessing(true);
    try {
      const success = await onBuy(token.id, parseFloat(amount), paymentType);
      if (success) {
        setShowConfirmation(false);
        setAmount('');
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!token) return null;

  const isPositive = token.change24h >= 0;

  return (
    <>
      <Dialog open={open && !showConfirmation} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border rounded-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {token.iconUrl ? (
                    <img src={token.iconUrl} alt={token.symbol} className="w-full h-full object-cover" />
                  ) : (
                    <img src={cubeLogo} alt={token.symbol} className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">{token.symbol}</h2>
                  <p className="text-xs text-muted-foreground">{token.name}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Price Display */}
          <div className="px-4 pt-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">
                ${token.price < 1 ? token.price.toFixed(6) : token.price.toFixed(2)}
              </span>
              <span className={`text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                <TrendingUp className={`w-4 h-4 ${!isPositive && 'rotate-180'}`} />
                {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-40 px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? 'hsl(147, 90%, 45%)' : 'hsl(0, 72%, 55%)'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPositive ? 'hsl(147, 90%, 45%)' : 'hsl(0, 72%, 55%)'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? 'hsl(147, 90%, 45%)' : 'hsl(0, 72%, 55%)'}
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Time Filters */}
          <div className="flex justify-center gap-2 px-4 pb-4">
            {['1H', '1D', '1W', '1M'].map((period) => (
              <button
                key={period}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  period === '1D' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            <Card className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Market Cap</p>
              <p className="text-sm font-semibold text-foreground">
                ${token.marketCap >= 1000000 
                  ? (token.marketCap / 1000000).toFixed(2) + 'M' 
                  : (token.marketCap / 1000).toFixed(1) + 'K'}
              </p>
            </Card>
            <Card className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground">Holders</p>
              <p className="text-sm font-semibold text-foreground">
                {token.holdersCount?.toLocaleString() || '0'}
              </p>
            </Card>
          </div>

          {/* Buy Section */}
          <div className="p-4 border-t border-border space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('buy')}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'buy' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setActiveTab('swap')}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'swap' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                Swap
              </button>
            </div>

            <div className="space-y-3">
              {/* You Pay */}
              <Card className="p-3 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">You Pay</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 border-0 bg-transparent text-lg font-semibold p-0 h-auto focus-visible:ring-0"
                  />
                  <button
                    onClick={() => setPaymentType(paymentType === 'usdc' ? 'eth' : 'usdc')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full"
                  >
                    <span className="text-sm font-medium">{paymentType.toUpperCase()}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {paymentType === 'usdc' 
                    ? `${usdcBalance.toLocaleString()} USDC` 
                    : `${ethBalance.toFixed(4)} ETH`}
                </p>
              </Card>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground rotate-90" />
                </div>
              </div>

              {/* You Receive */}
              <Card className="p-3 rounded-xl bg-primary/5 border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">You Receive</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-foreground">
                    {tokensToReceive > 0 ? tokensToReceive.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-sm font-medium text-primary">{token.symbol}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ ${(tokensToReceive * token.price).toFixed(2)} • Market Cap: ${(token.marketCap / 1000).toFixed(1)}K
                </p>
              </Card>
            </div>

            <Button
              className="w-full rounded-full"
              onClick={handleBuy}
              disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
            >
              Buy {token.symbol}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-sm rounded-2xl">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <img src={cubeLogo} alt="" className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Confirm Transaction</h2>
            
            <Card className="p-4 rounded-xl bg-muted/50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You Pay</span>
                  <span className="font-medium">{amount} {paymentType.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You Receive</span>
                  <span className="font-medium text-primary">{tokensToReceive.toFixed(2)} {token.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per Token</span>
                  <span className="font-medium">${token.price < 1 ? token.price.toFixed(6) : token.price.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <p className="text-xs text-muted-foreground">
              This is a sandbox transaction. No real tokens will be exchanged.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full"
                onClick={confirmTransaction}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Confirm'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
