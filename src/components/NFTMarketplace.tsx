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
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [listPrice, setListPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedForPurchase, setSelectedForPurchase] = useState<any>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (showListDialog && user?.user_metadata?.farcaster_fid && userNFTs.length === 0) {
      fetchUserNFTs();
    }
  }, [showListDialog, user]);

  const fetchUserNFTs = async () => {
    if (!user?.user_metadata?.farcaster_fid) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-user-nfts', {
        body: { fid: user.user_metadata.farcaster_fid },
      });

      if (error) throw error;

      if (data?.success) {
        setUserNFTs(data.nfts || []);
        toast.success(`Found ${data.nfts?.length || 0} NFTs on Base`);
      }
    } catch (error: any) {
      console.error('Error fetching NFTs:', error);
      toast.error('Failed to fetch your NFTs');
    } finally {
      setLoading(false);
    }
  };

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

  const handleListNFT = async () => {
    if (!selectedNFT || !listPrice) {
      toast.error('Please select an NFT and set a price');
      return;
    }

    if (parseFloat(listPrice) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    try {
      const { error } = await supabase.from('nft_listings').insert({
        user_id: user!.id,
        token_address: selectedNFT.tokenAddress,
        token_id: selectedNFT.tokenId,
        token_standard: selectedNFT.tokenStandard,
        chain: 'base',
        price_amount: parseFloat(listPrice),
        price_currency: 'USDC',
        name: selectedNFT.name,
        description: selectedNFT.description,
        image_url: selectedNFT.imageUrl,
        metadata: selectedNFT.metadata,
        status: 'active',
      });

      if (error) throw error;

      toast.success('NFT listed successfully!');
      setShowListDialog(false);
      setSelectedNFT(null);
      setListPrice('');
      setUserNFTs([]);
      fetchListings();
    } catch (error: any) {
      console.error('Error listing NFT:', error);
      toast.error('Failed to list NFT');
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">NFT Marketplace</h2>
        {user && (
          <Button 
            onClick={() => setShowListDialog(true)} 
            className="gap-2 w-full sm:w-auto"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            List NFT
          </Button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search NFTs..."
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-48 p-2 rounded-md border border-input bg-background text-foreground"
        >
          <option value="all">All NFTs</option>
          <option value="collectibles">Collectibles</option>
        </select>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredListings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {listing.image_url && (
              <img
                src={listing.image_url}
                alt={listing.name}
                className="w-full h-32 sm:h-48 object-cover"
              />
            )}
            <div className="p-3 sm:p-4 space-y-2">
              <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{listing.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {listing.description}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-base sm:text-lg font-bold text-primary">
                    {listing.price_amount} {listing.price_currency}
                  </p>
                  <Badge variant="secondary" className="text-xs">{listing.chain}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  by @{listing.profiles?.farcaster_username || 'Unknown'}
                </p>
                <Button
                  onClick={() => handleBuyNFT(listing)}
                  className="w-full"
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
        <Card className="p-8 sm:p-12">
          <div className="text-center">
            <Wallet className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No NFTs Listed</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {searchTerm ? 'No NFTs match your search.' : 'Be the first to list an NFT for sale!'}
            </p>
            {user && !searchTerm && (
              <Button onClick={() => setShowListDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                List NFT
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* List NFT Dialog */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>List Your NFT</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Detecting NFTs in your wallet...</p>
            </div>
          ) : userNFTs.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No NFTs Found</h3>
              <p className="text-muted-foreground mb-4">
                No NFTs or Farcaster collectibles found in your wallet on Base L2
              </p>
              <Button onClick={fetchUserNFTs} variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Refresh Wallet
              </Button>
            </div>
          ) : !selectedNFT ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select an NFT from your wallet to list for sale
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-2">
                {userNFTs.map((nft, index) => (
                  <Card
                    key={index}
                    className="p-3 cursor-pointer hover:border-primary transition-all"
                    onClick={() => setSelectedNFT(nft)}
                  >
                    {nft.imageUrl && (
                      <img
                        src={nft.imageUrl}
                        alt={nft.name}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <h4 className="font-semibold text-sm text-foreground truncate">{nft.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      #{nft.tokenId}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                {selectedNFT.imageUrl && (
                  <img
                    src={selectedNFT.imageUrl}
                    alt={selectedNFT.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-foreground">{selectedNFT.name}</h4>
                  <p className="text-sm text-muted-foreground">Token #{selectedNFT.tokenId}</p>
                  {selectedNFT.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {selectedNFT.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-base font-semibold">
                  Set Price (USDC)
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="Enter price in USDC"
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Set your listing price in USDC on Base L2
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleListNFT} className="flex-1" size="lg">
                  List NFT for Sale
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedNFT(null);
                    setListPrice('');
                  }}
                  size="lg"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
