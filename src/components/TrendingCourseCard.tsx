import { Card } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { ShareToFarcaster } from './ShareToFarcaster';

interface TrendingCourseCardProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    price_usdc: number | null;
    enrollment_count: number | null;
    rating: number | null;
  };
}

export const TrendingCourseCard = ({ course }: TrendingCourseCardProps) => {
  return (
    <Card className="p-4 hover:border-primary/50 transition-all duration-300">
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1">{course.title}</h4>
          {course.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {course.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {course.price_usdc !== null && (
                <span className="text-sm font-semibold text-primary">
                  ${course.price_usdc} USDC
                </span>
              )}
              {course.enrollment_count !== null && course.enrollment_count > 0 && (
                <span className="text-xs text-muted-foreground">
                  {course.enrollment_count} enrolled
                </span>
              )}
            </div>
            <ShareToFarcaster
              text={`Check out this course: ${course.title} on @uniquehub! 🎓 Learn now! 💎`}
              embeds={course.thumbnail_url ? [course.thumbnail_url] : undefined}
              buttonText="Share"
              variant="ghost"
              size="sm"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
