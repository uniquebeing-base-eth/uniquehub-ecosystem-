
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, ShoppingBag, Plus, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSandboxWallet } from '@/hooks/useSandboxWallet';
import { toast } from "sonner";

interface MarketItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price_usdc: number;
  user_id: string;
  category: string;
  creator_name?: string;
}

interface NFTListing {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_amount: number;
  price_currency: string;
  user_id: string;
  creator_name?: string;
}

export const MarketplaceSection = () => {
  const { user } = useAuth();
  const { wallet, updateBalance, refetch: refetchWallet } = useSandboxWallet();
  const [items, setItems] = useState<(MarketItem | NFTListing)[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'nfts' | 'items' | 'mine'>('all');
  const [selectedItem, setSelectedItem] = useState<MarketItem | NFTListing | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // List new item form
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState('');

  useEffect(() => {
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    setIsLoading(true);

    // Fetch NFT listings
    const { data: nfts } = await supabase
      .from('nft_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Fetch marketplace items
    const { data: marketItems } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const allItems: (MarketItem | NFTListing)[] = [];

    // Enrich with creator info
    if (nfts) {
      for (const nft of nfts) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', nft.user_id)
          .single();
        
        allItems.push({
          ...nft,
          creator_name: profile?.display_name || 'Creator',
        });
      }
    }

    if (marketItems) {
      for (const item of marketItems) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', item.user_id)
          .single();
        
        allItems.push({
          ...item,
          creator_name: profile?.display_name || 'Creator',
        });
      }
    }

    setItems(allItems);
    setIsLoading(false);
  };

  const getItemName = (item: MarketItem | NFTListing) => {
    return 'name' in item ? item.name : item.title;
  };

  const getItemPrice = (item: MarketItem | NFTListing) => {
    if ('price_amount' in item) {
      return { amount: item.price_amount, currency: item.price_currency };
    }
    return { amount: item.price_usdc, currency: 'USDC' };
  };

  const isNFT = (item: MarketItem | NFTListing): item is NFTListing => {
    return 'price_amount' in item;
  };

  const filteredItems = items.filter((item) => {
    const name = getItemName(item);
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeFilter) {
      case 'nfts':
        return isNFT(item);
      case 'items':
        return !isNFT(item);
      case 'mine':
        return item.user_id === user?.id;
      default:
        return true;
    }
  });

  const handlePurchase = async () => {
    if (!user || !selectedItem || !wallet) return;

    const price = getItemPrice(selectedItem);
    
    if (price.currency === 'USDC' && wallet.usdc_balance < price.amount) {
      toast.error('Insufficient USDC balance');
      return;
    }

    setIsPurchasing(true);
    try {
      // Deduct from buyer
      if (price.currency === 'USDC') {
        await updateBalance('usdc', -price.amount);
      }

      // Credit seller
      const sellerFee = price.amount * 0.95; // 5% platform fee
      const { data: sellerWallet } = await supabase
        .from('sandbox_wallets')
        .select('usdc_balance')
        .eq('user_id', selectedItem.user_id)
        .single();

      if (sellerWallet) {
        await supabase
          .from('sandbox_wallets')
          .update({ usdc_balance: sellerWallet.usdc_balance + sellerFee })
          .eq('user_id', selectedItem.user_id);
      }

      // Mark as sold
      if (isNFT(selectedItem)) {
        await supabase
          .from('nft_listings')
          .update({ status: 'sold', buyer_user_id: user.id, sold_at: new Date().toISOString() })
          .eq('id', selectedItem.id);
      } else {
        await supabase
          .from('marketplace_items')
          .update({ status: 'sold' })
          .eq('id', selectedItem.id);
      }

      // Record transaction
      await supabase.from('sandbox_transactions').insert({
        from_user_id: user.id,
        to_user_id: selectedItem.user_id,
        transaction_type: 'marketplace_purchase',
        amount: price.amount,
        currency: price.currency,
        description: `Purchased ${getItemName(selectedItem)}`,
      });

      toast.success('Purchase successful!');
      setShowDetailModal(false);
      await fetchItems();
      await refetchWallet();
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleListItem = async () => {
    if (!user || !newItemTitle || !newItemPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsListing(true);
    try {
      const { error } = await supabase.from('marketplace_items').insert({
        user_id: user.id,
        title: newItemTitle,
        description: newItemDescription,
        price_usdc: parseFloat(newItemPrice),
        image_url: newItemImage || null,
        status: 'active',
      });

      if (error) throw error;

      toast.success('Item listed successfully!');
      setShowListModal(false);
      setNewItemTitle('');
      setNewItemDescription('');
      setNewItemPrice('');
      setNewItemImage('');
      await fetchItems();
    } catch (error) {
      console.error('Listing error:', error);
      toast.error('Failed to list item');
    } finally {
      setIsListing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <Button 
          size="sm" 
          className="rounded-full"
          onClick={() => setShowListModal(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          List Item
        </Button>
      </div>

      {/* Balance Indicator */}
      {wallet && (
        <Card className="p-3 rounded-xl bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Available Balance</span>
            <span className="text-sm font-semibold text-primary">
              ${wallet.usdc_balance.toLocaleString()} USDC
            </span>
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(['all', 'nfts', 'items', 'mine'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all capitalize ${
              activeFilter === filter
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {filter === 'mine' ? 'My Listings' : filter}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-full bg-muted border-0"
        />
      </div>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            const price = getItemPrice(item);
            return (
              <Card 
                key={item.id}
                className="overflow-hidden rounded-2xl hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailModal(true);
                }}
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={getItemName(item)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      {isNFT(item) ? (
                        <Image className="w-12 h-12 text-primary/30" />
                      ) : (
                        <ShoppingBag className="w-12 h-12 text-primary/30" />
                      )}
                    </div>
                  )}
                  {isNFT(item) && (
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                      NFT
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 space-y-2">
                  <h4 className="font-semibold text-sm text-foreground truncate">
                    {getItemName(item)}
                  </h4>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-xs text-muted-foreground truncate">
                      {item.creator_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">
                      ${price.amount} {price.currency}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center rounded-2xl">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">
            {searchTerm 
              ? 'No items found matching your search.' 
              : activeFilter === 'mine' 
                ? "You haven't listed any items yet."
                : 'No items available.'}
          </p>
          {activeFilter === 'mine' && (
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => setShowListModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              List Your First Item
            </Button>
          )}
        </Card>
      )}

      {/* Item Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                {selectedItem.image_url ? (
                  <img
                    src={selectedItem.image_url}
                    alt={getItemName(selectedItem)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <ShoppingBag className="w-16 h-16 text-primary/30" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg text-foreground">{getItemName(selectedItem)}</h3>
                  {isNFT(selectedItem) && (
                    <Badge className="bg-primary text-primary-foreground">NFT</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.description || 'No description available.'}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-xl font-bold text-primary">
                    ${getItemPrice(selectedItem).amount} {getItemPrice(selectedItem).currency}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Seller</p>
                  <p className="text-sm font-medium text-foreground">{selectedItem.creator_name}</p>
                </div>
              </div>

              {selectedItem.user_id !== user?.id ? (
                <Button
                  className="w-full rounded-full"
                  onClick={handlePurchase}
                  disabled={isPurchasing || !wallet || wallet.usdc_balance < getItemPrice(selectedItem).amount}
                >
                  {isPurchasing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Buy for ${getItemPrice(selectedItem).amount}</>
                  )}
                </Button>
              ) : (
                <Button variant="outline" className="w-full rounded-full" disabled>
                  This is your listing
                </Button>
              )}

              {wallet && wallet.usdc_balance < getItemPrice(selectedItem).amount && selectedItem.user_id !== user?.id && (
                <p className="text-xs text-destructive text-center">
                  Insufficient balance
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* List Item Modal */}
      <Dialog open={showListModal} onOpenChange={setShowListModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">List New Item</DialogTitle>
            <DialogDescription>
              Create a listing to sell on the marketplace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Title *</label>
              <Input
                placeholder="Item name"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
              <Input
                placeholder="Describe your item..."
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Price (USDC) *</label>
              <Input
                type="number"
                placeholder="0.00"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Image URL</label>
              <Input
                placeholder="https://..."
                value={newItemImage}
                onChange={(e) => setNewItemImage(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <Button
              className="w-full rounded-full"
              onClick={handleListItem}
              disabled={isListing || !newItemTitle || !newItemPrice}
            >
              {isListing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'List Item'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
