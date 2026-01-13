
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SandboxWallet {
  id: string;
  user_id: string;
  usdc_balance: number;
  eth_balance: number;
}

interface TokenBalance {
  id: string;
  token_type: string;
  token_id: string | null;
  token_symbol: string;
  balance: number;
}

interface CreatorCoin {
  id: string;
  name: string;
  symbol: string;
  icon_url: string | null;
  holders_count: number;
  creator_user_id: string;
}

export const useSandboxWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<SandboxWallet | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [creatorCoin, setCreatorCoin] = useState<CreatorCoin | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch or create sandbox wallet
      let { data: walletData, error } = await supabase
        .from('sandbox_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Wallet doesn't exist, create it
        const { data: newWallet, error: insertError } = await supabase
          .from('sandbox_wallets')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        walletData = newWallet;
      } else if (error) {
        throw error;
      }

      setWallet(walletData);

      // Fetch token balances
      const { data: tokens } = await supabase
        .from('user_token_balances')
        .select('*')
        .eq('user_id', user.id);

      setTokenBalances(tokens || []);

      // Fetch user's creator coin if exists
      const { data: coinData } = await supabase
        .from('creator_coins')
        .select('*')
        .eq('creator_user_id', user.id)
        .single();

      setCreatorCoin(coinData || null);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const updateBalance = async (type: 'usdc' | 'eth', amount: number) => {
    if (!user || !wallet) return false;

    const field = type === 'usdc' ? 'usdc_balance' : 'eth_balance';
    const currentBalance = type === 'usdc' ? wallet.usdc_balance : wallet.eth_balance;
    const newBalance = currentBalance + amount;

    if (newBalance < 0) return false;

    const { error } = await supabase
      .from('sandbox_wallets')
      .update({ [field]: newBalance })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating balance:', error);
      return false;
    }

    setWallet({ ...wallet, [field]: newBalance });
    return true;
  };

  const createCreatorCoin = async (name: string, symbol: string, iconUrl?: string) => {
    if (!user) return null;

    try {
      const { data: coin, error } = await supabase
        .from('creator_coins')
        .insert({
          creator_user_id: user.id,
          name,
          symbol: symbol.toUpperCase(),
          icon_url: iconUrl,
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial allocation to creator (10% = 100,000 tokens)
      await supabase.from('user_token_balances').insert({
        user_id: user.id,
        token_type: 'creator_coin',
        token_id: coin.id,
        token_symbol: coin.symbol,
        balance: 100000,
      });

      // Record transaction
      await supabase.from('sandbox_transactions').insert({
        from_user_id: user.id,
        transaction_type: 'coin_creation',
        amount: 100000,
        currency: coin.symbol,
        token_id: coin.id,
        description: `Created creator coin ${coin.symbol}`,
      });

      setCreatorCoin(coin);
      await fetchWallet();
      return coin;
    } catch (error) {
      console.error('Error creating creator coin:', error);
      return null;
    }
  };

  const sendTokens = async (
    toUserId: string,
    tokenType: 'usdc' | 'eth' | 'token',
    amount: number,
    tokenId?: string,
    tokenSymbol?: string
  ) => {
    if (!user) return false;

    try {
      if (tokenType === 'usdc' || tokenType === 'eth') {
        // Update sender's balance
        const success = await updateBalance(tokenType, -amount);
        if (!success) return false;

        // Update receiver's balance
        const { data: receiverWallet, error: fetchError } = await supabase
          .from('sandbox_wallets')
          .select('*')
          .eq('user_id', toUserId)
          .single();

        if (fetchError) {
          // Create wallet for receiver if doesn't exist
          await supabase.from('sandbox_wallets').insert({
            user_id: toUserId,
            usdc_balance: tokenType === 'usdc' ? amount : 0,
            eth_balance: tokenType === 'eth' ? amount : 0,
          });
        } else {
          const field = tokenType === 'usdc' ? 'usdc_balance' : 'eth_balance';
          await supabase
            .from('sandbox_wallets')
            .update({ [field]: (receiverWallet as any)[field] + amount })
            .eq('user_id', toUserId);
        }

        // Record transaction
        await supabase.from('sandbox_transactions').insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          transaction_type: 'token_transfer',
          amount,
          currency: tokenType.toUpperCase(),
          description: `Sent ${amount} ${tokenType.toUpperCase()}`,
        });

        return true;
      } else if (tokenId && tokenSymbol) {
        // Token transfer logic
        const senderBalance = tokenBalances.find(
          (t) => t.token_id === tokenId && t.token_type !== 'platform'
        );
        if (!senderBalance || senderBalance.balance < amount) return false;

        // Update sender balance
        await supabase
          .from('user_token_balances')
          .update({ balance: senderBalance.balance - amount })
          .eq('id', senderBalance.id);

        // Update or create receiver balance
        const { data: receiverBalance } = await supabase
          .from('user_token_balances')
          .select('*')
          .eq('user_id', toUserId)
          .eq('token_id', tokenId)
          .single();

        if (receiverBalance) {
          await supabase
            .from('user_token_balances')
            .update({ balance: (receiverBalance as any).balance + amount })
            .eq('id', (receiverBalance as any).id);
        } else {
          await supabase.from('user_token_balances').insert({
            user_id: toUserId,
            token_type: senderBalance.token_type,
            token_id: tokenId,
            token_symbol: tokenSymbol,
            balance: amount,
          });
        }

        // Record transaction
        await supabase.from('sandbox_transactions').insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          transaction_type: 'token_transfer',
          amount,
          currency: tokenSymbol,
          token_id: tokenId,
          description: `Sent ${amount} ${tokenSymbol}`,
        });

        await fetchWallet();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending tokens:', error);
      return false;
    }
  };

  const purchaseCourse = async (courseId: string, price: number, creatorUserId: string) => {
    if (!user || !wallet) return false;
    if (wallet.usdc_balance < price) return false;

    try {
      // Deduct USDC from buyer
      await updateBalance('usdc', -price);

      // Credit creator with ETH fee (2%)
      const creatorFee = price * 0.02;
      const { data: creatorWallet } = await supabase
        .from('sandbox_wallets')
        .select('eth_balance')
        .eq('user_id', creatorUserId)
        .single();

      if (creatorWallet) {
        await supabase
          .from('sandbox_wallets')
          .update({ eth_balance: (creatorWallet as any).eth_balance + creatorFee / 1000 })
          .eq('user_id', creatorUserId);
      }

      // Check if course coin exists, if not create it
      let { data: courseCoin } = await supabase
        .from('course_coins')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (!courseCoin) {
        // Get course info
        const { data: course } = await supabase
          .from('courses')
          .select('title, user_id')
          .eq('id', courseId)
          .single();

        if (course) {
          const symbol = '$' + (course as any).title.slice(0, 4).toUpperCase().replace(/\s/g, '');
          const { data: newCoin } = await supabase
            .from('course_coins')
            .insert({
              course_id: courseId,
              name: (course as any).title + ' Coin',
              symbol,
            })
            .select()
            .single();
          courseCoin = newCoin;
        }
      }

      // Mint course coin to buyer
      if (courseCoin) {
        const mintAmount = 100; // Fixed amount per purchase
        
        // Check existing balance
        const { data: existingBalance } = await supabase
          .from('user_token_balances')
          .select('*')
          .eq('user_id', user.id)
          .eq('token_id', courseCoin.id)
          .single();

        if (existingBalance) {
          await supabase
            .from('user_token_balances')
            .update({ balance: (existingBalance as any).balance + mintAmount })
            .eq('id', (existingBalance as any).id);
        } else {
          await supabase.from('user_token_balances').insert({
            user_id: user.id,
            token_type: 'course_coin',
            token_id: courseCoin.id,
            token_symbol: (courseCoin as any).symbol,
            balance: mintAmount,
          });
        }

        // Update circulating supply
        await supabase
          .from('course_coins')
          .update({ 
            circulating_supply: Number((courseCoin as any).circulating_supply) + mintAmount,
            holders_count: Number((courseCoin as any).holders_count) + 1
          })
          .eq('id', courseCoin.id);
      }

      // Record transaction
      await supabase.from('sandbox_transactions').insert({
        from_user_id: user.id,
        to_user_id: creatorUserId,
        transaction_type: 'course_purchase',
        amount: price,
        currency: 'USDC',
        description: `Purchased course for ${price} USDC`,
      });

      await fetchWallet();
      return true;
    } catch (error) {
      console.error('Error purchasing course:', error);
      return false;
    }
  };

  return {
    wallet,
    tokenBalances,
    creatorCoin,
    loading,
    updateBalance,
    createCreatorCoin,
    sendTokens,
    purchaseCourse,
    refetch: fetchWallet,
  };
};
