import { Wallet, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const WalletConnector = () => {
  const { user, privyAuthenticated, privyUser, walletAddress, login, signOut } = useAuth();
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

  // Get display info from Privy or profile
  const getDisplayName = () => {
    if (privyUser) {
      const farcaster = privyUser.linkedAccounts?.find((a: any) => a.type === 'farcaster');
      const twitter = privyUser.linkedAccounts?.find((a: any) => a.type === 'twitter_oauth');
      const email = privyUser.linkedAccounts?.find((a: any) => a.type === 'email');
      
      if (farcaster?.displayName) return farcaster.displayName;
      if (twitter?.name) return twitter.name;
      if (email?.address) return email.address.split('@')[0];
    }
    return profile?.display_name || 'User';
  };

  const getUsername = () => {
    if (privyUser) {
      const farcaster = privyUser.linkedAccounts?.find((a: any) => a.type === 'farcaster');
      const twitter = privyUser.linkedAccounts?.find((a: any) => a.type === 'twitter_oauth');
      
      if (farcaster?.username) return `@${farcaster.username}`;
      if (twitter?.username) return `@${twitter.username}`;
    }
    if (profile?.farcaster_username) return `@${profile.farcaster_username}`;
    if (walletAddress) return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    return null;
  };

  const getAvatarUrl = () => {
    if (privyUser) {
      const farcaster = privyUser.linkedAccounts?.find((a: any) => a.type === 'farcaster');
      const twitter = privyUser.linkedAccounts?.find((a: any) => a.type === 'twitter_oauth');
      
      if (farcaster?.pfp) return farcaster.pfp;
      if (twitter?.profilePictureUrl) return twitter.profilePictureUrl;
    }
    return profile?.avatar_url;
  };

  return (
    <div className="bg-card/90 backdrop-blur-sm border-t border-border p-4">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {privyAuthenticated ? (
              <>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={getAvatarUrl()} alt={getDisplayName()} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                    {getDisplayName().slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium text-foreground">
                    {getDisplayName()}
                  </div>
                  {getUsername() && (
                    <div className="text-muted-foreground">
                      {getUsername()}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">Welcome</div>
                  <div className="text-muted-foreground">Sign in to continue</div>
                </div>
              </>
            )}
          </div>
          
          {privyAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-sm"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Sign Out
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={login}
              className="text-sm bg-gradient-primary hover:opacity-90"
            >
              <Wallet className="w-3 h-3 mr-1" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
