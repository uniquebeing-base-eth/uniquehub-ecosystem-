import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NFTMarketplace } from "@/components/NFTMarketplace";

export const MarketplaceSection = () => {
  const { user } = useAuth();
  const [nfts, setNfts] = useState<any[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filters = [
    { value: "all", label: "All NFTs" },
    { value: "recent", label: "Recent" },
    { value: "trending", label: "Trending" },
    { value: "art", label: "Art" },
    { value: "gaming", label: "Gaming" },
  ];

  useEffect(() => {
    fetchNfts();
  }, []);

  useEffect(() => {
    filterNfts();
  }, [nfts, searchTerm, selectedFilter]);

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

  const filterNfts = () => {
    let filtered = [...nfts];

    if (searchTerm) {
      filtered = filtered.filter(nft =>
        nft.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedFilter === "recent") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (selectedFilter === "trending") {
      // Sort by views or popularity if available
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (selectedFilter !== "all") {
      filtered = filtered.filter(nft => nft.category === selectedFilter);
    }

    setFilteredNfts(filtered);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header with List NFT Button */}
      <Button className="w-full bg-gradient-primary text-white hover:opacity-90 h-12 rounded-full font-semibold">
        + List NFT
      </Button>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search NFTs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 rounded-full bg-card border-border"
        />
      </div>

      {/* Category Filter */}
      <select
        value={selectedFilter}
        onChange={(e) => setSelectedFilter(e.target.value)}
        className="w-full p-3 rounded-full border border-border bg-card text-foreground text-sm font-medium"
      >
        {filters.map((filter) => (
          <option key={filter.value} value={filter.value}>
            {filter.label}
          </option>
        ))}
      </select>

      {/* NFT Marketplace Component */}
      <NFTMarketplace />

      {/* Empty State for Custom NFTs */}
      {filteredNfts.length === 0 && (
        <Card className="p-12 text-center rounded-3xl bg-card/50 border-border">
          <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No NFTs Listed</h3>
          <p className="text-muted-foreground mb-6">
            Be the first to list an NFT for sale!
          </p>
          <Button className="bg-gradient-primary text-white hover:opacity-90 rounded-full px-8">
            + List NFT
          </Button>
        </Card>
      )}

      {/* Legacy Marketplace Divider */}
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground font-medium">Legacy Marketplace</span>
        </div>
      </div>

      {/* Legacy Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">General Items</h2>
          <Button className="bg-primary hover:bg-primary/90 rounded-full px-6">
            + List Item
          </Button>
        </div>

        {/* Legacy Items Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3">
          {/* Placeholder cards */}
          <Card className="overflow-hidden rounded-2xl bg-card border-border">
            <div className="w-full h-40 bg-gradient-primary/20 flex items-center justify-center">
              <Wallet className="w-12 h-12 text-primary" />
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground text-center">No items yet</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};