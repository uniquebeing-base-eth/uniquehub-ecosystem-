import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NFTMarketplace } from "@/components/NFTMarketplace";
import { MarketplaceItemDetail } from "@/components/MarketplaceItemDetail";
import { ShareToFarcaster } from "@/components/ShareToFarcaster";

export const MarketplaceSection = () => {
  const { user } = useAuth();
  const [nfts, setNfts] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filters = [
    { value: "all", label: "All Items" },
    { value: "fashion", label: "Fashion" },
    { value: "art", label: "Art" },
    { value: "collectibles", label: "Collectibles" },
    { value: "electronics", label: "Electronics" },
    { value: "accessories", label: "Accessories" },
    { value: "nfts", label: "NFTs" },
  ];

  useEffect(() => {
    fetchNfts();
    fetchMarketItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [nfts, marketItems, searchTerm, selectedFilter]);

  const fetchMarketItems = async () => {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setMarketItems(data);
    }
  };

  const fetchNfts = async () => {
    const { data, error } = await supabase
      .from('nft_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setNfts(data);
    }
  };

  const filterItems = () => {
    let filtered: any[] = [];

    // Combine marketplace items and NFTs
    if (selectedFilter === "nfts") {
      filtered = [...nfts];
    } else if (selectedFilter === "all") {
      filtered = [...marketItems, ...nfts];
    } else {
      filtered = marketItems.filter(item => item.category === selectedFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search items, NFTs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 rounded-full bg-card border-border text-sm"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedFilter(filter.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedFilter === filter.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground border border-border'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Marketplace Items Grid */}
      {selectedFilter !== "nfts" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Marketplace Items</h3>
          {filteredItems.filter(item => item.title).length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No items found</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.filter(item => item.title).map((item) => (
                <Card key={item.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-3 space-y-2">
                    <h4 className="font-semibold text-sm line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">${item.price_usdc} USDC</span>
                      <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1" 
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsDetailOpen(true);
                        }}
                      >
                        Buy Now
                      </Button>
                      <ShareToFarcaster
                        text={`Check out ${item.title} on @uniquehub marketplace! 🛍️ $${item.price_usdc} USDC`}
                        embeds={[`https://ucqcrhfcflrepsdlcvpq.supabase.co/functions/v1/farcaster-frame?title=${encodeURIComponent(item.title)}&description=${encodeURIComponent(item.description || '')}&image=${encodeURIComponent(item.image_url || 'https://uniqueehub.vercel.app/opengraph-image.png')}`]}
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NFT Marketplace Component */}
      {(selectedFilter === "all" || selectedFilter === "nfts") && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">NFTs</h3>
          <NFTMarketplace />
        </div>
      )}

      {/* Marketplace Item Detail Dialog */}
      <MarketplaceItemDetail
        item={selectedItem}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
};