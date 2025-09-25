import { GraduationCap, Users, DollarSign, BookOpen } from "lucide-react";

export const TutorInfo = () => {
  return (
    <div className="bg-gradient-card rounded-xl p-6 border border-border space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <GraduationCap className="w-8 h-8 text-primary" />
        <h2 className="text-xl font-bold text-foreground">About the Tutor Section</h2>
      </div>
      
      <p className="text-muted-foreground">
        The Tutor section is your teaching dashboard where you can create and manage courses, 
        track your students, and earn from sharing your knowledge.
      </p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Create Courses</span>
        </div>
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Manage Students</span>
        </div>
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Earn Revenue</span>
        </div>
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Share Knowledge</span>
        </div>
      </div>
    </div>
  );
};