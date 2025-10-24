import { useState } from "react";
import { Upload, BookOpen, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseUpload } from "@/components/CourseUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const UploadSection = () => {
  const [showCourseUpload, setShowCourseUpload] = useState(false);
  const [showNFTUpload, setShowNFTUpload] = useState(false);

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Upload Content</h2>
        <p className="text-muted-foreground">
          Share your knowledge or list your NFTs
        </p>
      </div>

      <div className="grid gap-4">
        <Card
          className="p-6 cursor-pointer hover:border-primary transition-all group"
          onClick={() => setShowCourseUpload(true)}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center group-hover:shadow-glow transition-all">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Upload Course</h3>
              <p className="text-sm text-muted-foreground">
                Share your knowledge and earn 0.2 USDC per upload
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-primary transition-all group"
          onClick={() => setShowNFTUpload(true)}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center group-hover:shadow-glow transition-all">
              <Image className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">List NFT</h3>
              <p className="text-sm text-muted-foreground">
                List your NFTs for sale and reach collectors
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
          <CourseUpload />
        </DialogContent>
      </Dialog>

      <Dialog open={showNFTUpload} onOpenChange={setShowNFTUpload}>
        <DialogContent className="max-w-lg p-4">
          <DialogHeader>
            <DialogTitle className="text-base">List NFT</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 text-sm text-muted-foreground">
            NFT listing coming soon...
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
