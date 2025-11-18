import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const InitializeCourses = ({ onComplete }: { onComplete: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkCourses();
  }, []);

  const checkCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_courses')
        .select('id')
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        onComplete();
      } else {
        setChecking(false);
      }
    } catch (error) {
      console.error('Error checking courses:', error);
      setChecking(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-learning-courses');

      if (error) throw error;

      toast.success("Learning courses generated successfully!");
      onComplete();
    } catch (error) {
      console.error('Error generating courses:', error);
      toast.error("Failed to generate courses");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Initialize Quest System</h2>
        <p className="text-muted-foreground">
          Generate learning courses to start your quest journey
        </p>
        <Button
          onClick={handleGenerate}
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Courses"
          )}
        </Button>
      </div>
    </div>
  );
};
