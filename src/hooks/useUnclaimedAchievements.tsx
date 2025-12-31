
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_level: number;
  milestone_value: number;
  points_awarded: number;
  badge_icon: string;
  badge_color: string;
}


export const useUnclaimedAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchUnclaimedAchievements();
  }, [user]);

  const fetchUnclaimedAchievements = async () => {
    try {
      console.log('Fetching unclaimed achievements for user:', user!.id);
      
      const { data, error } = await supabase
        .from('creator_achievements')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_claimed', false)
        .order('awarded_at', { ascending: true });

      if (error) {
        console.error('Error fetching achievements:', error);
        throw error;
      }

      console.log('Unclaimed achievements found:', data?.length || 0, data);

      if (data && data.length > 0) {
        setAchievements(data);
        // Small delay to ensure UI is ready
        setTimeout(() => setShowModal(true), 500);
      }
    } catch (error) {
      console.error('Error fetching unclaimed achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchUnclaimedAchievements();
  };

  return {
    achievements,
    loading,
    showModal,
    setShowModal,
    refetch
  };
};
