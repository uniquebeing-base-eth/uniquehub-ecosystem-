import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Wallet, Plus, Search, Loader2 } from 'lucide-react';

/**
 * NFT Marketplace Component
 * Displays user's NFTs fetched via Neynar and allows listing them for sale on Base L2
 */
export const NFTMarketplace = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedForPurchase, setSelectedForPurchase] = useState<any>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('nft_listings')
        .select('*, profiles!nft_listings_user_id_fkey(display_name, farcaster_username)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const handleBuyNFT = async (listing: any) => {
    if (!user) {
      toast.error('Please sign in to buy NFTs');
      return;
    }

    setSelectedForPurchase(listing);

    try {
      const { data, error } = await supabase.functions.invoke('create-nft-purchase-frame', {
        body: { listingId: listing.id },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Transaction frame created! Simulating purchase...');
        // In a real implementation, this would open the Farcaster transaction frame
        console.log('Transaction frame:', data.frameMetadata);
        
        // Simulate transaction and award points
        setTimeout(async () => {
          toast.success('NFT purchase completed!');
          
          // Award UP points for purchase
          try {
            const { data: pointsData } = await supabase.functions.invoke('process-transaction-with-fees', {
              body: {
                transactionType: 'buy',
                amountUsd: parseFloat(listing.price_amount?.toString() || '0'),
                transactionHash: data.listingId, // Using listing ID as simulated tx hash
              },
            });

            if (pointsData?.success) {
              toast.success(`🎉 ${pointsData.message}`, { duration: 5000 });
            }
          } catch (error) {
            console.error('Error awarding points:', error);
          }

          setSelectedForPurchase(null);
          fetchListings();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error creating purchase frame:', error);
      toast.error('Failed to create purchase transaction');
      setSelectedForPurchase(null);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (categoryFilter === 'all') return matchesSearch;
    if (categoryFilter === 'collectibles') {
      return matchesSearch && (listing.name?.toLowerCase().includes('collectible') || 
                               listing.description?.toLowerCase().includes('collectible'));
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* NFT Grid - Mobile First */}
      <div className="grid grid-cols-2 gap-3">
        {filteredListings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border bg-card rounded-2xl hover:scale-[1.02]">
            {listing.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.name}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gradient-primary flex items-center justify-center">
                <Wallet className="w-12 h-12 text-white" />
              </div>
            )}
            <div className="p-3 space-y-2">
              <Badge variant="secondary" className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border-0 w-fit">
                {listing.chain?.toUpperCase() || 'BASE'}
              </Badge>
              <h3 className="font-bold text-sm text-foreground line-clamp-2 min-h-[2.5rem]">{listing.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                {listing.description || 'No description'}
              </p>
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-primary">
                    {listing.price_amount} {listing.price_currency}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  by @{listing.profiles?.farcaster_username || 'Unknown'}
                </p>
                <Button
                  onClick={() => handleBuyNFT(listing)}
                  className="w-full bg-gradient-primary text-white hover:opacity-90 rounded-full"
                  size="sm"
                  disabled={!user || listing.user_id === user?.id || selectedForPurchase?.id === listing.id}
                >
                  {!user ? 'Sign In' : listing.user_id === user?.id ? 'Your NFT' : selectedForPurchase?.id === listing.id ? 'Processing...' : 'Buy Now'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredListings.length === 0 && (
        <Card className="p-8 text-center rounded-3xl bg-card/50 border-border">
          <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">No NFTs Available</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? 'No NFTs match your search.' : 'Check back later for new listings!'}
          </p>
        </Card>
      )}
    </div>
  );
};
