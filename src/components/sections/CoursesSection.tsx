import { CourseCard } from "@/components/CourseCard";
import { BookOpen, Rocket, Hexagon, DollarSign } from "lucide-react";

export const CoursesSection = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Courses</h1>
      <div className="grid grid-cols-2 gap-6">
        <CourseCard
          title="Intro to Web3"
          icon={<BookOpen className="w-8 h-8" />}
        />
        <CourseCard
          title="How to Earn with Tasks"
          icon={<Rocket className="w-8 h-8" />}
        />
        <CourseCard
          title="NFT Trading Basics"
          icon={<Hexagon className="w-8 h-8" />}
        />
        <CourseCard
          title="DeFi Fundamentals"
          icon={<DollarSign className="w-8 h-8" />}
        />
      </div>
    </div>
  );
};