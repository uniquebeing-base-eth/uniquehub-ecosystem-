
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
import { Wallet, Plus, Search, Loader2, ShoppingBag, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * NFT Marketplace Component
 * Displays user's NFTs fetched via Neynar and allows listing them for sale on Base L2
 */
export const NFTMarketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nftListings, setNftListings] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedForPurchase, setSelectedForPurchase] = useState<any>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      // Fetch NFT listings
      const { data: nfts, error: nftError } = await supabase
        .from('nft_listings')
        .select('*, profiles!nft_listings_user_id_fkey(display_name, farcaster_username)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (nftError) throw nftError;
      setNftListings(nfts || []);

      // Fetch market items
      const { data: items, error: itemsError } = await supabase
        .from('marketplace_items')
        .select('*, profiles!marketplace_items_user_id_fkey(display_name, farcaster_username)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setMarketItems(items || []);
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

  const handleContactSeller = (item: any) => {
    if (!user) {
      toast.error('Please sign in to contact sellers');
      return;
    }
    // Navigate to profile section with the seller's info
    toast.success('Redirecting to seller profile...');
    // In a real implementation, this would navigate to a chat or profile page
    console.log('Contact seller:', item.profiles);
  };

  // Combine and filter all listings
  const allListings = [
    ...nftListings.map(item => ({ ...item, type: 'nft' })),
    ...marketItems.map(item => ({ ...item, type: 'market' }))
  ];

  const filteredListings = allListings.filter(listing => {
    const matchesSearch = (listing.name || listing.title)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (categoryFilter === 'all') return matchesSearch;
    return matchesSearch && listing.category === categoryFilter;
  });

  return (
    <div className="space-y-4">
      {/* Listings Grid - Mobile First */}
      <div className="grid grid-cols-2 gap-3">
        {filteredListings.map((listing) => (
          <Card key={`${listing.type}-${listing.id}`} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border bg-card rounded-2xl hover:scale-[1.02]">
            {listing.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.name || listing.title}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gradient-primary flex items-center justify-center">
                {listing.type === 'nft' ? (
                  <Wallet className="w-12 h-12 text-white" />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-white" />
                )}
              </div>
            )}
            <div className="p-3 space-y-2">
              <div className="flex gap-1.5">
                <Badge variant="secondary" className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border-0 w-fit">
                  {listing.type === 'nft' ? 'NFT' : 'ITEM'}
                </Badge>
                {listing.category && (
                  <Badge variant="outline" className="text-xs px-2.5 py-1 rounded-full text-muted-foreground border-border w-fit">
                    {listing.category}
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-sm text-foreground line-clamp-2 min-h-[2.5rem]">
                {listing.name || listing.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                {listing.description || 'No description'}
              </p>
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-primary">
                    {listing.price_amount || listing.price_usdc} {listing.price_currency || 'USDC'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  by @{listing.profiles?.farcaster_username || 'Unknown'}
                </p>
                {listing.type === 'nft' ? (
                  <Button
                    onClick={() => handleBuyNFT(listing)}
                    className="w-full bg-gradient-primary text-white hover:opacity-90 rounded-full"
                    size="sm"
                    disabled={!user || listing.user_id === user?.id || selectedForPurchase?.id === listing.id}
                  >
                    {!user ? 'Sign In' : listing.user_id === user?.id ? 'Your NFT' : selectedForPurchase?.id === listing.id ? 'Processing...' : 'Buy Now'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleContactSeller(listing)}
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full"
                    size="sm"
                    disabled={!user || listing.user_id === user?.id}
                  >
                    {!user ? 'Sign In' : listing.user_id === user?.id ? 'Your Item' : (
                      <>
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                        Contact Seller
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredListings.length === 0 && (
        <Card className="p-8 text-center rounded-3xl bg-card/50 border-border">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">No Items Available</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? 'No items match your search.' : 'Check back later for new listings!'}
          </p>
        </Card>
      )}
    </div>
  );
};
