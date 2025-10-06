import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Wallet, Plus, Search } from 'lucide-react';

/**
 * NFT Marketplace Component
 * Displays user's NFTs fetched via Neynar and allows listing them for sale on Base L2
 */
export const NFTMarketplace = () => {
  const { user } = useAuth();
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showListForm, setShowListForm] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [listPrice, setListPrice] = useState('');
  const [listCurrency, setListCurrency] = useState('USDC');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForPurchase, setSelectedForPurchase] = useState<any>(null);

  useEffect(() => {
    fetchListings();
    if (user?.user_metadata?.farcaster_fid) {
      fetchUserNFTs();
    }
  }, [user]);

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

    try {
      const { error } = await supabase.from('nft_listings').insert({
        user_id: user!.id,
        token_address: selectedNFT.tokenAddress,
        token_id: selectedNFT.tokenId,
        token_standard: selectedNFT.tokenStandard,
        chain: 'base',
        price_amount: parseFloat(listPrice),
        price_currency: listCurrency,
        name: selectedNFT.name,
        description: selectedNFT.description,
        image_url: selectedNFT.imageUrl,
        metadata: selectedNFT.metadata,
        status: 'active',
      });

      if (error) throw error;

      toast.success('NFT listed successfully!');
      setShowListForm(false);
      setSelectedNFT(null);
      setListPrice('');
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

  const filteredListings = listings.filter(listing =>
    listing.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">NFT Marketplace</h2>
        {user && (
          <Button onClick={() => setShowListForm(!showListForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            List NFT
          </Button>
        )}
      </div>

      {/* User's NFTs Section */}
      {user && showListForm && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Your NFTs on Base</h3>
          
          {loading ? (
            <p className="text-muted-foreground">Loading your NFTs...</p>
          ) : userNFTs.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No NFTs found on Base L2</p>
              <Button onClick={fetchUserNFTs} variant="outline">
                Refresh NFTs
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {userNFTs.map((nft, index) => (
                  <Card
                    key={index}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedNFT?.tokenId === nft.tokenId ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedNFT(nft)}
                  >
                    {nft.imageUrl && (
                      <img
                        src={nft.imageUrl}
                        alt={nft.name}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <h4 className="font-semibold text-foreground truncate">{nft.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      Token #{nft.tokenId}
                    </p>
                  </Card>
                ))}
              </div>

              {selectedNFT && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold text-foreground">List {selectedNFT.name} for Sale</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={listPrice}
                        onChange={(e) => setListPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <select
                        value={listCurrency}
                        onChange={(e) => setListCurrency(e.target.value)}
                        className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                      >
                        <option value="USDC">USDC</option>
                        <option value="ETH">ETH</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleListNFT}>List NFT</Button>
                    <Button variant="outline" onClick={() => {
                      setSelectedNFT(null);
                      setShowListForm(false);
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Marketplace Listings */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search NFTs..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              {listing.image_url && (
                <img
                  src={listing.image_url}
                  alt={listing.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4 space-y-3">
                <h3 className="font-bold text-foreground truncate">{listing.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {listing.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {listing.price_amount} {listing.price_currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by @{listing.profiles?.farcaster_username || 'Unknown'}
                    </p>
                  </div>
                  <Badge variant="secondary">{listing.chain}</Badge>
                </div>
                <Button
                  onClick={() => handleBuyNFT(listing)}
                  className="w-full"
                  disabled={!user || listing.user_id === user?.id || selectedForPurchase?.id === listing.id}
                >
                  {!user ? 'Sign In' : listing.user_id === user?.id ? 'Your NFT' : selectedForPurchase?.id === listing.id ? 'Processing...' : 'Buy Now'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No NFTs Listed</h3>
              <p className="text-muted-foreground">
                Be the first to list an NFT for sale!
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
