

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Plus, X, Upload, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useViemClients } from '@/hooks/useViemClients';
import { useFarcasterWallet } from '@/hooks/useFarcasterWallet';
import { parseUnits } from 'viem';
import { base } from 'wagmi/chains';
import { 
  MARKETPLACE_CONTRACT_ABI, 
  MARKETPLACE_CONTRACT_ADDRESS, 
  USDC_ABI, 
  USDC_ADDRESS, 
  MARKETPLACE_LISTING_FEE 
} from '@/config/wagmi';

interface MarketItemUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CatalogItem {
  title: string;
  description: string;
  price_usdc: string;
  image_url: string;
  category: string;
  imageFile?: File;
}


export const MarketItemUpload = ({ onSuccess, onCancel }: MarketItemUploadProps) => {
  const { user } = useAuth();
  const { address } = useFarcasterWallet();
  const { publicClient, walletClient } = useViemClients(address);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([
    { title: '', description: '', price_usdc: '', image_url: '', category: 'general' }
  ]);
  const [uploading, setUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'fashion', label: 'Fashion & Apparel' },
    { value: 'art', label: 'Digital Art' },
    { value: 'collectibles', label: 'Collectibles' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'accessories', label: 'Accessories' },
  ];

  const addCatalogItem = () => {
    if (catalogItems.length < 10) {
      setCatalogItems([...catalogItems, { title: '', description: '', price_usdc: '', image_url: '', category: 'general' }]);
      setCurrentIndex(catalogItems.length); // Move to new item
    } else {
      toast.error('Maximum 10 items per upload');
    }
  };

  const removeCatalogItem = (index: number) => {
    if (catalogItems.length > 1) {
      setCatalogItems(catalogItems.filter((_, i) => i !== index));
      if (currentIndex >= catalogItems.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  const updateCatalogItem = (index: number, field: keyof CatalogItem, value: string | File) => {
    const updated = [...catalogItems];
    if (field === 'imageFile' && value instanceof File) {
      updated[index] = { ...updated[index], imageFile: value };
    } else if (typeof value === 'string') {
      updated[index] = { ...updated[index], [field]: value };
    }
    setCatalogItems(updated);
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars') // Reusing existing bucket
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      updateCatalogItem(index, 'image_url', publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to list market items');
      return;
    }

    if (!address || !walletClient || !publicClient) {
      toast.error('Please connect your wallet');
      return;
    }

    // Validate all items
    for (let i = 0; i < catalogItems.length; i++) {
      const item = catalogItems[i];
      if (!item.title || !item.description || !item.price_usdc) {
        toast.error(`Please fill all fields for item ${i + 1}`);
        return;
      }
      if (parseFloat(item.price_usdc) <= 0) {
        toast.error(`Invalid price for item ${i + 1}`);
        return;
      }
      if (!item.image_url) {
        toast.error(`Please upload an image for item ${i + 1}`);
        return;
      }
    }

    setUploading(true);

    try {
      // Calculate total USDC needed (listing fee per item)
      const totalFeeNeeded = MARKETPLACE_LISTING_FEE * BigInt(catalogItems.length);

      // Step 1: Check USDC allowance
      const currentAllowance = (await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [address, MARKETPLACE_CONTRACT_ADDRESS],
      } as any)) as bigint;

      // Step 2: Approve USDC if needed
      if (currentAllowance < totalFeeNeeded) {
        toast.info('Approving USDC for listing fees...');
        const approveHash = await walletClient.writeContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [MARKETPLACE_CONTRACT_ADDRESS, totalFeeNeeded],
          chain: base,
          account: address,
        });

        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        toast.success('USDC approved!');
      }

      // Step 3: Insert items into database first to get IDs
      const itemsToInsert = catalogItems.map(item => ({
        user_id: user.id,
        title: item.title,
        description: item.description,
        price_usdc: parseFloat(item.price_usdc),
        image_url: item.image_url || null,
        category: item.category,
        status: 'active',
      }));

      const { data: insertedItems, error: insertError } = await supabase
        .from('marketplace_items')
        .insert(itemsToInsert)
        .select('id, title, description, price_usdc');

      if (insertError) throw insertError;
      if (!insertedItems || insertedItems.length === 0) throw new Error('Failed to create items');

      // Step 4: List each item on-chain
      for (let i = 0; i < insertedItems.length; i++) {
        const item = insertedItems[i];
        const priceInUSDC = parseUnits(item.price_usdc.toString(), 6); // USDC has 6 decimals

        toast.info(`Listing item ${i + 1}/${insertedItems.length} on-chain...`);

        const listHash = await walletClient.writeContract({
          address: MARKETPLACE_CONTRACT_ADDRESS,
          abi: MARKETPLACE_CONTRACT_ABI,
          functionName: 'listItem',
          args: [
            item.id, // Use database UUID as itemId
            item.title,
            item.description,
            priceInUSDC,
          ],
          chain: base,
          account: address,
        });

        await publicClient.waitForTransactionReceipt({ hash: listHash });
      }

      toast.success(`Successfully listed ${catalogItems.length} item(s) on-chain!`);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error listing items:', error);
      toast.error('Failed to list items: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const currentItem = catalogItems[currentIndex];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <p className="text-sm font-medium">
            Item {currentIndex + 1} of {catalogItems.length}
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setCurrentIndex(Math.min(catalogItems.length - 1, currentIndex + 1))}
            disabled={currentIndex === catalogItems.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          {catalogItems.length > 1 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => removeCatalogItem(currentIndex)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addCatalogItem}
            disabled={catalogItems.length >= 10}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal dots indicator */}
      <div className="flex justify-center gap-1.5">
        {catalogItems.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'w-6 bg-primary' 
                : 'w-2 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* Current Item Form */}
      <Card className="p-4 space-y-3">
        {/* Image Upload Section */}
        <div className="space-y-2">
          <Label>Product Image *</Label>
          {currentItem.image_url ? (
            <div className="relative group">
              <img
                src={currentItem.image_url}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border border-border"
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => updateCatalogItem(currentIndex, 'image_url', '')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload image</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (max 5MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Image must be less than 5MB');
                      return;
                    }
                    handleImageUpload(currentIndex, file);
                  }
                }}
              />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={currentItem.title}
            onChange={(e) => updateCatalogItem(currentIndex, 'title', e.target.value)}
            placeholder="e.g., Nike Air Max 270"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={currentItem.category}
            onValueChange={(value) => updateCatalogItem(currentIndex, 'category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={currentItem.description}
            onChange={(e) => updateCatalogItem(currentIndex, 'description', e.target.value)}
            placeholder="Describe your item..."
            className="min-h-[80px]"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price (USDC) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={currentItem.price_usdc}
            onChange={(e) => updateCatalogItem(currentIndex, 'price_usdc', e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </Card>

      <div className="flex gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={uploading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={uploading}
          className="flex-1 bg-gradient-primary text-white"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Listing...
            </>
          ) : (
            `List ${catalogItems.length} Item(s)`
          )}
        </Button>
      </div>
    </form>
  );
};
