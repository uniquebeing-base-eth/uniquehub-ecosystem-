import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, BookOpen, ShoppingBag, Trophy, Star } from "lucide-react";
import penguinAvatar from "@/assets/penguin-avatar.png";

export const ProfileSection = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Profile</h1>
      
      {/* User Info */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <img 
            src={penguinAvatar} 
            alt="Profile Avatar" 
            className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
          />
          <div>
            <h2 className="text-2xl font-bold text-foreground">UNIQUEBEING</h2>
            <p className="text-muted-foreground">Member since 2024</p>
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 text-primary fill-current" />
              <span className="text-sm font-medium">Level 1 Learner</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">2</div>
          <div className="text-sm text-muted-foreground">Courses Enrolled</div>
        </Card>
        <Card className="p-4 text-center">
          <ShoppingBag className="w-8 h-8 text-success mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">0</div>
          <div className="text-sm text-muted-foreground">Assets Owned</div>
        </Card>
        <Card className="p-4 text-center">
          <Trophy className="w-8 h-8 text-warning mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">150</div>
          <div className="text-sm text-muted-foreground">Points Earned</div>
        </Card>
      </div>

      {/* Current Courses */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Current Courses</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-card-hover rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold">W3</span>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Intro to Web3</h4>
                <p className="text-sm text-muted-foreground">3 of 8 lessons completed</p>
              </div>
            </div>
            <div className="text-right">
              <Progress value={37.5} className="w-24 mb-1" />
              <span className="text-xs text-muted-foreground">37%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-card-hover rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-success" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">How to Earn with Tasks</h4>
                <p className="text-sm text-muted-foreground">1 of 5 lessons completed</p>
              </div>
            </div>
            <div className="text-right">
              <Progress value={20} className="w-24 mb-1" />
              <span className="text-xs text-muted-foreground">20%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Achievements</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-card-hover rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="text-xs">First Steps</Badge>
              <p className="text-xs text-muted-foreground mt-1">Created your profile</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg opacity-50">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <Badge variant="outline" className="text-xs">Course Master</Badge>
              <p className="text-xs text-muted-foreground mt-1">Complete 5 courses</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};