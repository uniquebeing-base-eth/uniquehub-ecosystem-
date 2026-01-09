
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MarketplaceItemDetail } from '@/components/MarketplaceItemDetail';

interface NFTItem {
  id: string;
  name: string;
  image_url: string;
  price_amount: number;
  price_currency: string;
  creator: string;
  status: string;
  isNFT: boolean;
}

interface MarketItem {
  id: string;
  title: string;
  image_url: string;
  price_usdc: number;
  category: string;
  description: string;
  isNFT: boolean;
}

type CombinedItem = (NFTItem | MarketItem) & { isNFT: boolean };

export const MarketplaceSection = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<CombinedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CombinedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'trending' | 'owned'>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, activeFilter, user]);

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

    const combinedItems: CombinedItem[] = [];

    // Add NFTs
    if (nfts) {
      nfts.forEach(nft => {
        combinedItems.push({
          ...nft,
          isNFT: true,
          creator: nft.user_id?.slice(0, 8) || 'Unknown',
        } as NFTItem & { isNFT: boolean });
      });
    }

    // Add market items
    if (marketItems) {
      marketItems.forEach(item => {
        combinedItems.push({
          ...item,
          isNFT: false,
        } as MarketItem & { isNFT: boolean });
      });
    }

    setItems(combinedItems);
    setIsLoading(false);
  };

  const filterItems = () => {
    let filtered = [...items];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const name = 'name' in item ? item.name : 'title' in item ? item.title : '';
        const desc = 'description' in item ? item.description : '';
        return name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               desc?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Apply filter tabs
    if (activeFilter === 'owned' && user) {
      filtered = filtered.filter(item => 
        'user_id' in item && item.user_id === user.id
      );
    }

    setFilteredItems(filtered);
  };

  const getItemName = (item: CombinedItem) => {
    return 'name' in item ? item.name : 'title' in item ? item.title : 'Item';
  };

  const getItemImage = (item: CombinedItem) => {
    return item.image_url || '';
  };

  const getItemPrice = (item: CombinedItem) => {
    if ('price_amount' in item) {
      return `${item.price_amount} ${item.price_currency}`;
    }
    if ('price_usdc' in item) {
      return `$${item.price_usdc} USDC`;
    }
    return 'Price N/A';
  };

  const getItemCreator = (item: CombinedItem) => {
    if ('creator' in item) return item.creator;
    return 'Creator';
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
        <h1 className="text-xl font-bold text-foreground">Marketplace</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <ShoppingBag className="w-5 h-5" />
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'trending', 'owned'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
              activeFilter === filter
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items, collections"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full bg-muted border-0"
          />
        </div>
        <Button variant="outline" size="icon" className="rounded-full">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <Card 
              key={item.id}
              className="overflow-hidden rounded-2xl hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => {
                if (!item.isNFT) {
                  setSelectedItem(item);
                  setIsDetailOpen(true);
                }
              }}
            >
              {/* Image */}
              <div className="aspect-square relative overflow-hidden bg-muted">
                {getItemImage(item) ? (
                  <img
                    src={getItemImage(item)}
                    alt={getItemName(item)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-3 space-y-2">
                <h4 className="font-semibold text-sm text-foreground truncate">
                  {getItemName(item)}
                </h4>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground truncate">
                    {getItemCreator(item)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {getItemPrice(item)}
                  </span>
                  <Button size="sm" className="h-7 text-xs px-3 rounded-full">
                    Buy
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center rounded-2xl">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">
            {searchTerm ? 'No items found matching your search.' : 'No items available yet.'}
          </p>
        </Card>
      )}

      {/* Item Detail Dialog */}
      <MarketplaceItemDetail
        item={selectedItem}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
};
