
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wallet, Send, Plus, Coins, BookOpen, Copy, Check, Users, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSandboxWallet } from "@/hooks/useSandboxWallet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const { 
    wallet, 
    tokenBalances, 
    creatorCoin, 
    loading, 
    createCreatorCoin, 
    sendTokens, 
    refetch 
  } = useSandboxWallet();
  
  const [profile, setProfile] = useState<any>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateCoinModal, setShowCreateCoinModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [coinName, setCoinName] = useState('');
  const [coinSymbol, setCoinSymbol] = useState('');
  const [isCreating, setIsCreating] = useState(false);
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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(data);
  };

  const fetchStats = async () => {
    if (!user) return;
    
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id);
    setEnrolledCount(enrollments?.length || 0);
    
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('user_id', user.id);
    setCreatedCoursesCount(courses?.length || 0);
  };

  const handleCreateCoin = async () => {
    if (!coinName || !coinSymbol) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      const coin = await createCreatorCoin(coinName, `$${coinSymbol.toUpperCase()}`);
      if (coin) {
        toast.success('Creator coin created!', {
          description: `${coin.symbol} is now in your wallet`,
        });
        setShowCreateCoinModal(false);
        setCoinName('');
        setCoinSymbol('');
      } else {
        toast.error('Failed to create coin');
      }
    } catch (error) {
      toast.error('Failed to create coin');
    } finally {
      setIsCreating(false);
    }
  };

  const searchUsers = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, farcaster_username')
      .or(`display_name.ilike.%${term}%,farcaster_username.ilike.%${term}%`)
      .neq('user_id', user?.id || '')
      .limit(5);

    setSearchResults(data || []);
  };

  const handleSend = async () => {
    if (!selectedRecipient || !sendAmount || !selectedToken) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSending(true);
    try {
      let success = false;
      
      if ('type' in selectedToken) {
        success = await sendTokens(
          selectedRecipient.user_id,
          selectedToken.type,
          amount
        );
      } else {
        success = await sendTokens(
          selectedRecipient.user_id,
          'token',
          amount,
          selectedToken.token_id || undefined,
          selectedToken.token_symbol
        );
      }

      if (success) {
        toast.success('Transfer successful!', {
          description: `Sent ${amount} to ${selectedRecipient.display_name}`,
        });
        setShowSendModal(false);
        setSendAmount('');
        setSelectedRecipient(null);
        setSelectedToken(null);
        await refetch();
      } else {
        toast.error('Transfer failed. Check your balance.');
      }
    } catch (error) {
      toast.error('Transfer failed');
    } finally {
      setIsSending(false);
    }
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
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

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
            <h2 className="font-bold text-lg text-foreground">
              {profile?.display_name || 'UniqueHub User'}
            </h2>
            {profile?.farcaster_username && (
              <p className="text-sm text-muted-foreground">@{profile.farcaster_username}</p>
            )}
            <button 
              onClick={copyUserId}
              className="flex items-center gap-1 text-xs text-muted-foreground mt-1 hover:text-primary transition-colors"
            >
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
      <Card 
        className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground cursor-pointer hover:opacity-95 transition-all"
        onClick={() => setShowWalletModal(true)}
      >
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
            <p className="text-xl font-bold">
              ${loading ? '...' : wallet?.usdc_balance?.toLocaleString() || '10,000'}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-80">ETH</p>
            <p className="text-xl font-bold">
              {loading ? '...' : wallet?.eth_balance?.toFixed(4) || '5.0000'}
            </p>
          </div>
        </div>
      </Card>

      {/* Creator Coin Section */}
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={cubeLogo} alt="" className="w-5 h-5" />
            <h3 className="font-semibold text-foreground">Creator Coin</h3>
          </div>
        </div>
        {creatorCoin ? (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              {creatorCoin.icon_url ? (
                <img src={creatorCoin.icon_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <Coins className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{creatorCoin.name}</p>
              <p className="text-xs text-primary font-medium">{creatorCoin.symbol}</p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {creatorCoin.holders_count} holders
            </Badge>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Create your own creator coin to build your economy
            </p>
            <Button 
              onClick={() => setShowCreateCoinModal(true)}
              className="rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Creator Coin
            </Button>
          </div>
        )}
      </Card>

      {/* Token Balances */}
      {tokenBalances.length > 0 && (
        <Card className="p-4 rounded-2xl">
          <h3 className="font-semibold text-foreground mb-3">Your Tokens</h3>
          <div className="space-y-2">
            {tokenBalances.slice(0, 5).map((token) => (
              <div 
                key={token.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Coins className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{token.token_symbol}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{token.token_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <p className="font-semibold text-foreground">{token.balance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          className="rounded-xl h-12"
          onClick={() => {
            setSelectedToken({ type: 'usdc' });
            setShowSendModal(true);
          }}
        >
          <Send className="w-4 h-4 mr-2" />
          Send Tokens
        </Button>
        <Button 
          variant="outline" 
          className="rounded-xl h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Wallet Modal */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Wallet</DialogTitle>
            <DialogDescription>Your sandbox wallet balances</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Balances */}
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className="p-4 rounded-xl cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => {
                  setSelectedToken({ type: 'usdc' });
                  setShowWalletModal(false);
                  setShowSendModal(true);
                }}
              >
                <p className="text-xs text-muted-foreground mb-1">USDC</p>
                <p className="text-2xl font-bold text-foreground">
                  ${wallet?.usdc_balance?.toLocaleString() || '10,000'}
                </p>
              </Card>
              <Card 
                className="p-4 rounded-xl cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => {
                  setSelectedToken({ type: 'eth' });
                  setShowWalletModal(false);
                  setShowSendModal(true);
                }}
              >
                <p className="text-xs text-muted-foreground mb-1">ETH</p>
                <p className="text-2xl font-bold text-foreground">
                  {wallet?.eth_balance?.toFixed(4) || '5.0000'}
                </p>
              </Card>
            </div>

            {/* All Tokens */}
            {tokenBalances.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">All Tokens</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {tokenBalances.map((token) => (
                    <Card 
                      key={token.id}
                      className="p-3 rounded-xl cursor-pointer hover:border-primary/50 transition-all"
                      onClick={() => {
                        setSelectedToken(token);
                        setShowWalletModal(false);
                        setShowSendModal(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Coins className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{token.token_symbol}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {token.token_type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold">{token.balance.toLocaleString()}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Button 
              variant="outline"
              className="w-full rounded-full"
              onClick={() => setShowWalletModal(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Coin Modal */}
      <Dialog open={showCreateCoinModal} onOpenChange={setShowCreateCoinModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Creator Coin</DialogTitle>
            <DialogDescription>
              Create your own token to build your creator economy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Coin Name</label>
              <Input
                placeholder="e.g., Alex Coin"
                value={coinName}
                onChange={(e) => setCoinName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Symbol</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  placeholder="ALEX"
                  value={coinSymbol}
                  onChange={(e) => setCoinSymbol(e.target.value.toUpperCase().slice(0, 6))}
                  className="pl-7 rounded-xl uppercase"
                  maxLength={6}
                />
              </div>
            </div>

            <Card className="p-3 bg-primary/5 border-primary/20 rounded-xl">
              <p className="text-xs text-muted-foreground">
                <strong>Tokenomics:</strong> 10% (100,000 tokens) will be allocated to your wallet immediately. 
                The remaining tokens are reserved for future distribution.
              </p>
            </Card>

            <Button
              className="w-full rounded-full"
              onClick={handleCreateCoin}
              disabled={isCreating || !coinName || !coinSymbol}
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Create Coin'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Tokens Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Send Tokens</DialogTitle>
            <DialogDescription>
              Transfer tokens to another UniqueHub user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Token Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Token</label>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={selectedToken && 'type' in selectedToken && selectedToken.type === 'usdc' ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => setSelectedToken({ type: 'usdc' })}
                >
                  USDC (${wallet?.usdc_balance?.toLocaleString() || 0})
                </Badge>
                <Badge
                  variant={selectedToken && 'type' in selectedToken && selectedToken.type === 'eth' ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => setSelectedToken({ type: 'eth' })}
                >
                  ETH ({wallet?.eth_balance?.toFixed(4) || 0})
                </Badge>
                {tokenBalances.map((token) => (
                  <Badge
                    key={token.id}
                    variant={selectedToken && !('type' in selectedToken) && selectedToken.id === token.id ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => setSelectedToken(token)}
                  >
                    {token.token_symbol} ({token.balance.toLocaleString()})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Recipient Search */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Recipient</label>
              {selectedRecipient ? (
                <Card className="p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={selectedRecipient.avatar_url} />
                        <AvatarFallback className="text-xs bg-primary/20">
                          {selectedRecipient.display_name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{selectedRecipient.display_name}</p>
                        {selectedRecipient.farcaster_username && (
                          <p className="text-xs text-muted-foreground">@{selectedRecipient.farcaster_username}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRecipient(null)}
                    >
                      Change
                    </Button>
                  </div>
                </Card>
              ) : (
                <div>
                  <Input
                    placeholder="Search by name or username..."
                    value={recipientSearch}
                    onChange={(e) => {
                      setRecipientSearch(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="rounded-xl"
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {searchResults.map((result) => (
                        <Card
                          key={result.user_id}
                          className="p-2 rounded-xl cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedRecipient(result);
                            setRecipientSearch('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={result.avatar_url} />
                              <AvatarFallback className="text-[10px] bg-primary/20">
                                {result.display_name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{result.display_name}</span>
                            {result.farcaster_username && (
                              <span className="text-xs text-muted-foreground">@{result.farcaster_username}</span>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              className="w-full rounded-full"
              onClick={handleSend}
              disabled={isSending || !selectedRecipient || !sendAmount || !selectedToken}
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
