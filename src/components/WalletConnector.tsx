import { Wallet, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const WalletConnector = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(data);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="bg-card/90 backdrop-blur-sm border-t border-border p-4">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || 'User'} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                    {(profile?.display_name || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium text-foreground">
                    {profile?.display_name || 'Farcaster User'}
                  </div>
                  {profile?.farcaster_username && (
                    <div className="text-muted-foreground">
                      @{profile.farcaster_username}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">Connecting...</div>
                  <div className="text-muted-foreground">Please wait</div>
                </div>
              </>
            )}
          </div>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-sm"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
