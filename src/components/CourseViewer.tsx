import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, BookOpen, X } from 'lucide-react';

interface CourseViewerProps {
  course: any;
  onClose: () => void;
}

export const CourseViewer = ({ course, onClose }: CourseViewerProps) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-0" onClick={onClose}>
      <div className="w-full max-w-lg mb-14 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Card className="rounded-t-3xl overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-border flex items-center justify-between bg-card">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{course.title}</h3>
              <p className="text-[10px] text-muted-foreground truncate">{course.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Video Player */}
          <div className="bg-black">
            {course.video_url ? (
              <video
                controls
                className="w-full aspect-video"
                src={course.video_url}
                poster={course.thumbnail_url}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full aspect-video bg-gradient-primary flex flex-col items-center justify-center">
                <Play className="w-12 h-12 text-white mb-2" />
                <p className="text-white text-xs">No video uploaded yet</p>
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="p-3 space-y-2 max-h-[30vh] overflow-y-auto">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{course.enrollment_count || 0} students enrolled</span>
            </div>
            
            {course.description && (
              <div className="pt-2 border-t border-border">
                <h4 className="text-xs font-semibold text-foreground mb-1">About this course</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
