
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, Coins, ShoppingCart, Repeat, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: string;
  from_user_id: string;
  to_user_id: string | null;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string | null;
  created_at: string;
  fromUsername?: string;
  toUsername?: string;
}

interface TransactionHistoryProps {
  open: boolean;
  onClose: () => void;
}

const getTransactionIcon = (type: string, isOutgoing: boolean) => {
  switch (type) {
    case 'token_transfer':
      return isOutgoing ? ArrowUpRight : ArrowDownLeft;
    case 'coin_creation':
      return Coins;
    case 'course_purchase':
      return ShoppingCart;
    case 'marketplace_purchase':
      return ImageIcon;
    case 'swap':
      return Repeat;
    case 'token_buy':
      return Coins;
    default:
      return Coins;
  }
};

const getTransactionLabel = (type: string) => {
  switch (type) {
    case 'token_transfer':
      return 'Transfer';
    case 'coin_creation':
      return 'Coin Created';
    case 'course_purchase':
      return 'Course Purchase';
    case 'marketplace_purchase':
      return 'Marketplace';
    case 'swap':
      return 'Swap';
    case 'token_buy':
      return 'Token Buy';
    default:
      return type.replace('_', ' ');
  }
};

export const TransactionHistory = ({ open, onClose }: TransactionHistoryProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchTransactions();
    }
  }, [open, user]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data } = await supabase
        .from('sandbox_transactions')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        // Enrich with usernames
        const enriched = await Promise.all(
          data.map(async (tx) => {
            let fromUsername = 'You';
            let toUsername = '';

            if (tx.from_user_id !== user.id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('user_id', tx.from_user_id)
                .single();
              fromUsername = profile?.display_name || 'User';
            }

            if (tx.to_user_id && tx.to_user_id !== user.id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('user_id', tx.to_user_id)
                .single();
              toUsername = profile?.display_name || 'User';
            } else if (tx.to_user_id === user.id) {
              toUsername = 'You';
            }

            return {
              ...tx,
              fromUsername,
              toUsername,
            };
          })
        );
        setTransactions(enriched);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Transaction History</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isOutgoing = tx.from_user_id === user?.id;
                const Icon = getTransactionIcon(tx.transaction_type, isOutgoing);
                const isPositive = !isOutgoing || tx.transaction_type === 'coin_creation' || tx.transaction_type === 'token_buy';

                return (
                  <Card key={tx.id} className="p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isPositive ? 'bg-success/10' : 'bg-destructive/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${isPositive ? 'text-success' : 'text-destructive'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground truncate">
                            {tx.description || getTransactionLabel(tx.transaction_type)}
                          </p>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {getTransactionLabel(tx.transaction_type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {tx.toUsername ? `${tx.fromUsername} → ${tx.toUsername}` : tx.fromUsername}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-semibold text-sm ${isPositive ? 'text-success' : 'text-foreground'}`}>
                          {isPositive ? '+' : '-'}{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{tx.currency}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Coins className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your transaction history will appear here
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
