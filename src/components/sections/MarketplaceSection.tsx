import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, DollarSign, Filter, Search, Plus, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const MarketplaceSection = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    price_usdc: '',
    category: 'nft',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const categories = [
    { value: "all", label: "All Items" },
    { value: "nft", label: "NFT Art" },
    { value: "digital-art", label: "Digital Art" },
    { value: "collectibles", label: "Collectibles" },
    { value: "photography", label: "Photography" },
    { value: "music", label: "Music" },
    { value: "gaming", label: "Gaming Items" },
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, selectedCategory, priceRange]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setItems(data);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (priceRange === "low") {
      filtered = filtered.filter(item => item.price_usdc <= 10);
    } else if (priceRange === "mid") {
      filtered = filtered.filter(item => item.price_usdc > 10 && item.price_usdc <= 50);
    } else if (priceRange === "high") {
      filtered = filtered.filter(item => item.price_usdc > 50);
    }

    setFilteredItems(filtered);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let image_url = null;

      if (imageFile) {
        const imagePath = `marketplace/${user.id}/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(imagePath, imageFile);

        if (!uploadError) {
          const { data: imageUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(imagePath);
          image_url = imageUrlData.publicUrl;
        }
      }

      const { error } = await supabase.from('marketplace_items').insert({
        user_id: user.id,
        title: uploadData.title,
        description: uploadData.description,
        price_usdc: parseFloat(uploadData.price_usdc),
        category: uploadData.category,
        image_url,
        status: 'active',
      });

      if (!error) {
        setShowUploadForm(false);
        setUploadData({ title: '', description: '', price_usdc: '', category: 'nft' });
        setImageFile(null);
        fetchItems();
      }
    } catch (error) {
      console.error('Error uploading item:', error);
    }
  };

  if (!user && showUploadForm) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
        <Card className="p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">Please connect your Farcaster wallet to list items</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
        {user && (
          <Button onClick={() => setShowUploadForm(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            List Item
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">List New Item</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Title</label>
                <Input
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  placeholder="Enter item title..."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                  className="w-full p-2 rounded-md border border-input bg-background text-foreground z-10"
                >
                  {categories.slice(1).map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
              <textarea
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                placeholder="Describe your item..."
                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Price (USDC)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    value={uploadData.price_usdc}
                    onChange={(e) => setUploadData({ ...uploadData, price_usdc: e.target.value })}
                    placeholder="0.00"
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Item Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                List Item
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowUploadForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground z-10"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground z-10"
            >
              <option value="all">All Prices</option>
              <option value="low">Under 10 USDC</option>
              <option value="mid">10-50 USDC</option>
              <option value="high">Above 50 USDC</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="p-4 hover:shadow-lg transition-shadow">
            {item.image_url && (
              <img 
                src={item.image_url} 
                alt={item.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {item.description}
            </p>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-bold text-lg">{item.price_usdc} USDC</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {categories.find(c => c.value === item.category)?.label || item.category}
              </Badge>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Buy Now
            </Button>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card className="p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">
            {items.length === 0 
              ? "No items listed yet. Be the first to list an item!"
              : "Try adjusting your filters to find items."
            }
          </p>
          {user && items.length === 0 && (
            <Button onClick={() => setShowUploadForm(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              List First Item
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};