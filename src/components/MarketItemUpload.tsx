import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

export const MarketItemUpload = ({ onSuccess, onCancel }: MarketItemUploadProps) => {
  const { user } = useAuth();
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([
    { title: '', description: '', price_usdc: '', image_url: '', category: 'general' }
  ]);
  const [uploading, setUploading] = useState(false);

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
    } else {
      toast.error('Maximum 10 items per upload');
    }
  };

  const removeCatalogItem = (index: number) => {
    if (catalogItems.length > 1) {
      setCatalogItems(catalogItems.filter((_, i) => i !== index));
    }
  };

  const updateCatalogItem = (index: number, field: keyof CatalogItem, value: string) => {
    const updated = [...catalogItems];
    updated[index] = { ...updated[index], [field]: value };
    setCatalogItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to list market items');
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
    }

    setUploading(true);

    try {
      // Insert all catalog items
      const itemsToInsert = catalogItems.map(item => ({
        user_id: user.id,
        title: item.title,
        description: item.description,
        price_usdc: parseFloat(item.price_usdc),
        image_url: item.image_url || null,
        category: item.category,
        status: 'active',
      }));

      const { error } = await supabase
        .from('marketplace_items')
        .insert(itemsToInsert);

      if (error) throw error;

      toast.success(`Successfully listed ${catalogItems.length} item(s)!`);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error listing items:', error);
      toast.error('Failed to list items: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add multiple items to your catalog ({catalogItems.length}/10)
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addCatalogItem}
          disabled={catalogItems.length >= 10}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {catalogItems.map((item, index) => (
          <div key={index} className="p-4 border border-border rounded-lg space-y-3 relative">
            {catalogItems.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => removeCatalogItem(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            
            <h4 className="font-semibold text-sm">Item {index + 1}</h4>

            <div className="space-y-2">
              <Label htmlFor={`title-${index}`}>Title</Label>
              <Input
                id={`title-${index}`}
                value={item.title}
                onChange={(e) => updateCatalogItem(index, 'title', e.target.value)}
                placeholder="e.g., Nike Air Max 270"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`category-${index}`}>Category</Label>
              <Select
                value={item.category}
                onValueChange={(value) => updateCatalogItem(index, 'category', value)}
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
              <Label htmlFor={`description-${index}`}>Description</Label>
              <Textarea
                id={`description-${index}`}
                value={item.description}
                onChange={(e) => updateCatalogItem(index, 'description', e.target.value)}
                placeholder="Describe your item..."
                className="min-h-[60px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`price-${index}`}>Price (USDC)</Label>
              <Input
                id={`price-${index}`}
                type="number"
                step="0.01"
                min="0"
                value={item.price_usdc}
                onChange={(e) => updateCatalogItem(index, 'price_usdc', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`image-${index}`}>Image URL (optional)</Label>
              <Input
                id={`image-${index}`}
                type="url"
                value={item.image_url}
                onChange={(e) => updateCatalogItem(index, 'image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        ))}
      </div>

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
