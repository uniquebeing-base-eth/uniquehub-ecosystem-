import { CourseCard } from "@/components/CourseCard";
import { NFTCard } from "@/components/NFTCard";
import { BookOpen, Rocket } from "lucide-react";

export const EarningSection = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Earning</h1>
      
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Courses</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <CourseCard
            title="Intro to Web3"
            icon={<BookOpen className="w-8 h-8" />}
          />
          <CourseCard
            title="How to Earn with Tasks"
            icon={<Rocket className="w-8 h-8" />}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Products</h2>
        <div className="grid grid-cols-2 gap-4">
          <NFTCard
            title="Web3 Design Tool"
            price="0.01"
            currency="ETH"
            gradient="bg-gradient-to-br from-primary to-primary-glow"
          />
          <NFTCard
            title="Crypto Artwork"
            price="10"
            currency="USDC"
            gradient="bg-gradient-to-br from-success to-primary"
          />
        </div>
      </div>
    </div>
  );
};