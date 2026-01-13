
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wallet, Send, Coins, BookOpen, Copy, Check, Users, ChevronRight, LogOut, History, TrendingUp, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSandboxWallet } from "@/hooks/useSandboxWallet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TokenDetailModal } from "@/components/TokenDetailModal";
import { TransactionHistory } from "@/components/TransactionHistory";
import { CREATOR_COIN_DEFAULTS, UNIQUEHUB_TOKEN, generate24hChange, formatPrice } from "@/lib/tokenPricing";
import cubeLogo from "@/assets/uniquehub-cube.png";

interface TokenBalance {
  id: string;
  token_type: string;
  token_id: string | null;
  token_symbol: string;
  balance: number;
}

interface UserSearchResult {
  user_id: string;
  display_name: string;
  avatar_url: string;
  farcaster_username: string;
}

export const ProfileSection = () => {
  const { user, signOut } = useAuth();
  const { wallet, tokenBalances, creatorCoin, loading, sendTokens, refetch } = useSandboxWallet();
  
  const [profile, setProfile] = useState<any>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showTokenDetail, setShowTokenDetail] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedTokenForDetail, setSelectedTokenForDetail] = useState<any>(null);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | { type: 'usdc' | 'eth' } | null>(null);
  const [sendAmount, setSendAmount] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<UserSearchResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [createdCoursesCount, setCreatedCoursesCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    setProfile(data);
  };

  const fetchStats = async () => {
    if (!user) return;
    const { data: enrollments } = await supabase.from('enrollments').select('id').eq('user_id', user.id);
    setEnrolledCount(enrollments?.length || 0);
    const { data: courses } = await supabase.from('courses').select('id').eq('user_id', user.id);
    setCreatedCoursesCount(courses?.length || 0);
  };

  const searchUsers = async (term: string) => {
    if (term.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, farcaster_username')
      .or(`display_name.ilike.%${term}%,farcaster_username.ilike.%${term}%`)
      .neq('user_id', user?.id || '')
      .limit(5);
    setSearchResults(data || []);
  };

  const handleSend = async () => {
    if (!selectedRecipient || !sendAmount || !selectedToken) return;
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsSending(true);
    try {
      let success = false;
      if ('type' in selectedToken) {
        success = await sendTokens(selectedRecipient.user_id, selectedToken.type, amount);
      } else {
        success = await sendTokens(selectedRecipient.user_id, 'token', amount, selectedToken.token_id || undefined, selectedToken.token_symbol);
      }
      if (success) {
        toast.success('Transfer successful!');
        setShowSendModal(false);
        setSendAmount('');
        setSelectedRecipient(null);
        await refetch();
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleTokenClick = (token: TokenBalance) => {
    const price = token.token_type === 'creator_coin' ? CREATOR_COIN_DEFAULTS.initialPrice : 0.01;
    const marketCap = token.token_type === 'creator_coin' ? CREATOR_COIN_DEFAULTS.initialMarketCap : 10000;
    
    setSelectedTokenForDetail({
      id: token.token_id || token.id,
      symbol: token.token_symbol,
      name: token.token_symbol.replace('$', '') + ' Token',
      price,
      marketCap,
      change24h: generate24hChange(token.token_symbol),
      totalSupply: token.token_type === 'creator_coin' ? 10_000_000 : 1_000_000,
      circulatingSupply: token.balance * 10,
      holdersCount: Math.floor(Math.random() * 500) + 50,
      type: token.token_type as any,
    });
    setShowTokenDetail(true);
  };

  const handleBuyToken = async (tokenId: string, amount: number, paymentType: 'usdc' | 'eth') => {
    if (!wallet) return false;
    const cost = paymentType === 'usdc' ? amount : amount * 2500;
    if (paymentType === 'usdc' && wallet.usdc_balance < amount) return false;
    if (paymentType === 'eth' && wallet.eth_balance < amount) return false;

    // Simulate purchase
    await supabase.from('sandbox_transactions').insert({
      from_user_id: user!.id,
      transaction_type: 'token_buy',
      amount: cost,
      currency: selectedTokenForDetail?.symbol || 'TOKEN',
      description: `Bought ${selectedTokenForDetail?.symbol} tokens`,
    });
    
    toast.success('Token purchase successful!');
    await refetch();
    return true;
  };

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      toast.success('User ID copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h1 className="text-xl font-bold text-foreground mb-2">Connect to Continue</h1>
        <p className="text-muted-foreground">Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <Button variant="ghost" size="icon" onClick={() => setShowTransactionHistory(true)}>
          <History className="w-5 h-5" />
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 ring-2 ring-primary/30">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl">
              {profile?.display_name?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-bold text-lg text-foreground">{profile?.display_name || 'UniqueHub User'}</h2>
            {profile?.farcaster_username && <p className="text-sm text-muted-foreground">@{profile.farcaster_username}</p>}
            <button onClick={copyUserId} className="flex items-center gap-1 text-xs text-muted-foreground mt-1 hover:text-primary">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span className="truncate max-w-[150px]">{user.id.slice(0, 8)}...{user.id.slice(-4)}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center rounded-xl">
          <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{enrolledCount}</p>
          <p className="text-[10px] text-muted-foreground">Enrolled</p>
        </Card>
        <Card className="p-3 text-center rounded-xl">
          <Users className="w-5 h-5 text-success mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{createdCoursesCount}</p>
          <p className="text-[10px] text-muted-foreground">Created</p>
        </Card>
        <Card className="p-3 text-center rounded-xl">
          <Coins className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{tokenBalances.length}</p>
          <p className="text-[10px] text-muted-foreground">Tokens</p>
        </Card>
      </div>

      {/* Wallet Card */}
      <Card className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground cursor-pointer" onClick={() => setShowWalletModal(true)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            <span className="font-semibold">Sandbox Wallet</span>
          </div>
          <ChevronRight className="w-5 h-5" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs opacity-80">USDC</p>
            <p className="text-xl font-bold">${loading ? '...' : wallet?.usdc_balance?.toLocaleString() || '10,000'}</p>
          </div>
          <div>
            <p className="text-xs opacity-80">ETH</p>
            <p className="text-xl font-bold">{loading ? '...' : wallet?.eth_balance?.toFixed(4) || '5.0000'}</p>
          </div>
        </div>
      </Card>

      {/* Token Balances with Charts */}
      {tokenBalances.length > 0 && (
        <Card className="p-4 rounded-2xl">
          <h3 className="font-semibold text-foreground mb-3">Your Tokens</h3>
          <div className="space-y-2">
            {tokenBalances.slice(0, 5).map((token) => {
              const price = token.token_type === 'creator_coin' ? CREATOR_COIN_DEFAULTS.initialPrice : 0.01;
              const change = generate24hChange(token.token_symbol);
              const isPositive = change >= 0;
              
              return (
                <Card
                  key={token.id}
                  className="p-3 rounded-xl cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => handleTokenClick(token)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <img src={cubeLogo} alt="" className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{token.token_symbol}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{token.balance.toLocaleString()}</p>
                      <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
                        <TrendingUp className={`w-3 h-3 ${!isPositive && 'rotate-180'}`} />
                        {isPositive ? '+' : ''}{change.toFixed(2)}%
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="rounded-xl h-12" onClick={() => { setSelectedToken({ type: 'usdc' }); setShowSendModal(true); }}>
          <Send className="w-4 h-4 mr-2" />Send Tokens
        </Button>
        <Button variant="outline" className="rounded-xl h-12 text-destructive border-destructive/30" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />Sign Out
        </Button>
      </div>

      {/* Wallet Modal */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>Wallet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">USDC</p>
                <p className="text-2xl font-bold">${wallet?.usdc_balance?.toLocaleString() || '10,000'}</p>
              </Card>
              <Card className="p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">ETH</p>
                <p className="text-2xl font-bold">{wallet?.eth_balance?.toFixed(4) || '5.0000'}</p>
              </Card>
            </div>
            <Button variant="outline" className="w-full rounded-full" onClick={() => { setShowWalletModal(false); setShowTransactionHistory(true); }}>
              <History className="w-4 h-4 mr-2" />View Transaction History
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Send Tokens</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Search user..." value={recipientSearch} onChange={(e) => { setRecipientSearch(e.target.value); searchUsers(e.target.value); }} className="rounded-xl" />
            {searchResults.length > 0 && (
              <div className="space-y-2">{searchResults.map((u) => (
                <Card key={u.user_id} className={`p-3 rounded-xl cursor-pointer ${selectedRecipient?.user_id === u.user_id ? 'border-primary' : ''}`} onClick={() => setSelectedRecipient(u)}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8"><AvatarImage src={u.avatar_url} /><AvatarFallback>{u.display_name?.slice(0,2)}</AvatarFallback></Avatar>
                    <span className="text-sm font-medium">{u.display_name}</span>
                  </div>
                </Card>
              ))}</div>
            )}
            <Input type="number" placeholder="Amount" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="rounded-xl" />
            <Button className="w-full rounded-full" onClick={handleSend} disabled={isSending || !selectedRecipient || !sendAmount}>
              {isSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Detail Modal */}
      <TokenDetailModal
        open={showTokenDetail}
        onClose={() => setShowTokenDetail(false)}
        token={selectedTokenForDetail}
        usdcBalance={wallet?.usdc_balance || 0}
        ethBalance={wallet?.eth_balance || 0}
        onBuy={handleBuyToken}
        onSwap={async () => true}
      />

      {/* Transaction History */}
      <TransactionHistory open={showTransactionHistory} onClose={() => setShowTransactionHistory(false)} />
    </div>
  );
};
