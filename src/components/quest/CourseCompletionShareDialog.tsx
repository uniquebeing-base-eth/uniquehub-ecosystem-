

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Share2, X } from "lucide-react";
import { ShareToFarcaster } from "@/components/ShareToFarcaster";

interface CourseCompletionShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  totalModules: number;
  totalPoints: number;
}

export const CourseCompletionShareDialog = ({
  open,
  onOpenChange,
  courseTitle,
  totalModules,
  totalPoints,
}: CourseCompletionShareDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Course Completed! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
            
            <h3 className="font-bold text-lg text-foreground mb-2">
              {courseTitle}
            </h3>
            
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-4">
              <div className="bg-card-hover rounded-lg p-3">
                <div className="text-2xl font-bold text-primary">{totalModules}</div>
                <div className="text-xs text-muted-foreground">Modules</div>
              </div>
              <div className="bg-card-hover rounded-lg p-3">
                <div className="text-2xl font-bold text-primary">{totalPoints}</div>
                <div className="text-xs text-muted-foreground">Points</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Congratulations on completing this course! Share your achievement with the community.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <ShareToFarcaster
              text={`🎓 Just completed "${courseTitle}" on @uniquehub! Finished ${totalModules} modules and earned ${totalPoints} UP points! 🚀\n\nJoin me in learning Web3! 💎`}
              embeds={['https://uniquehub.xyz']}
              buttonText="Share"
              size="default"
              variant="default"
              className="flex-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
