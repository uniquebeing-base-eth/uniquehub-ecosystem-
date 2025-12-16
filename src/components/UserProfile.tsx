
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfileProps {
  username: string;
}

export const UserProfile = ({ username }: UserProfileProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        // Fetch profile from database
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          // If we have a Farcaster FID, sync the latest profile data
          if (profileData.farcaster_fid) {
            const { data: syncData } = await supabase.functions.invoke(
              'sync-farcaster-profile',
              {
                body: { fid: profileData.farcaster_fid }
              }
            );

            if (syncData?.success && syncData.profile) {
              // Update local profile with fresh data
              await supabase
                .from('profiles')
                .update({
                  avatar_url: syncData.profile.pfpUrl,
                  bio: syncData.profile.bio,
                  display_name: syncData.profile.displayName,
                })
                .eq('user_id', user.id);

              setProfile({
                ...profileData,
                avatar_url: syncData.profile.pfpUrl,
                bio: syncData.profile.bio,
                display_name: syncData.profile.displayName,
              });
            } else {
              setProfile(profileData);
            }
          } else {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || username} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">
            {(profile?.display_name || username).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">
            {profile?.display_name || username}
          </h2>
          {profile?.farcaster_username && (
            <p className="text-sm text-muted-foreground">
              @{profile.farcaster_username}
            </p>
          )}
          {profile?.bio && (
            <p className="text-sm text-muted-foreground mt-2">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
