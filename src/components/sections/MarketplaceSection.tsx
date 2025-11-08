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
    { value: "all", label: "All Items" },
    { value: "fashion", label: "Fashion" },
    { value: "art", label: "Art" },
    { value: "collectibles", label: "Collectibles" },
    { value: "electronics", label: "Electronics" },
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

      {/* NFT Marketplace Component */}
      <NFTMarketplace />
    </div>
  );
};