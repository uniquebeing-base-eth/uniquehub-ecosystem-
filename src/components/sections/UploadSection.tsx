import { useState } from "react";
import { Upload, BookOpen, Image, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseUpload } from "@/components/CourseUpload";
import { MarketItemUpload } from "@/components/MarketItemUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import animeUploadBg from '@/assets/anime-upload-bg.jpg';
import cardBgUpload from '@/assets/card-bg-upload.jpg';

export const UploadSection = () => {
  const [showCourseUpload, setShowCourseUpload] = useState(false);
  const [showNFTUpload, setShowNFTUpload] = useState(false);
  const [showMarketItemUpload, setShowMarketItemUpload] = useState(false);

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Upload Content</h2>
        <p className="text-muted-foreground">
          Share courses, list NFTs, or sell your products
        </p>
      </div>

      <div className="grid gap-4">
        <Card
          className="p-6 cursor-pointer hover:border-primary transition-all group relative overflow-hidden"
          onClick={() => setShowCourseUpload(true)}
        >
          <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${cardBgUpload})` }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center group-hover:shadow-glow transition-all">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Upload Course</h3>
              <p className="text-sm text-muted-foreground">
                Publish your course and reach learners
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-primary transition-all group relative overflow-hidden"
          onClick={() => setShowNFTUpload(true)}
        >
          <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${cardBgUpload})` }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center group-hover:shadow-glow transition-all">
              <Image className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">List NFT</h3>
              <p className="text-sm text-muted-foreground">
                Resell your NFTs from wallet
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-primary transition-all group relative overflow-hidden"
          onClick={() => setShowMarketItemUpload(true)}
        >
          <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${cardBgUpload})` }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center group-hover:shadow-glow transition-all">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">List Market Items</h3>
              <p className="text-sm text-muted-foreground">
                Sell physical or digital products
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={showCourseUpload} onOpenChange={setShowCourseUpload}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-base">Upload Course</DialogTitle>
          </DialogHeader>
          <CourseUpload onSuccess={() => setShowCourseUpload(false)} onCancel={() => setShowCourseUpload(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showNFTUpload} onOpenChange={setShowNFTUpload}>
        <DialogContent className="max-w-lg p-4">
          <DialogHeader>
            <DialogTitle className="text-base">List NFT</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 text-sm text-muted-foreground">
            NFT wallet detection coming soon...
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMarketItemUpload} onOpenChange={setShowMarketItemUpload}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-base">List Market Items</DialogTitle>
          </DialogHeader>
          <MarketItemUpload 
            onSuccess={() => setShowMarketItemUpload(false)} 
            onCancel={() => setShowMarketItemUpload(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
