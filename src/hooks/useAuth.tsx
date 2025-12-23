import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  privyUser: any;
  privyAuthenticated: boolean;
  walletAddress: string | null;
  login: () => void;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { login, logout, authenticated, user: privyUser, ready } = usePrivy();
  const { wallets } = useWallets();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Get wallet address from connected wallet
  const walletAddress = wallets.length > 0 ? wallets[0].address : null;

  // Sync Privy auth with Supabase
  useEffect(() => {
    if (!ready) return;

    const syncAuthWithSupabase = async () => {
      if (authenticated && privyUser) {
        try {
          // Check for existing session
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          
          if (!existingSession) {
            // Create anonymous session for Supabase RLS
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) {
              console.error('Error creating Supabase session:', error);
            } else {
              setSession(data.session);
              setUser(data.user);
            }
          } else {
            setSession(existingSession);
            setUser(existingSession.user);
          }

          // Create or update profile with Privy user data
          if (user || existingSession?.user) {
            const userId = user?.id || existingSession?.user?.id;
            if (userId) {
              await createOrUpdateProfile(userId, privyUser);
            }
          }
        } catch (error) {
          console.error('Error syncing auth:', error);
        }
      } else if (!authenticated) {
        // Clear session when logged out
        setSession(null);
        setUser(null);
      }
      
      setLoading(false);
    };

    syncAuthWithSupabase();
  }, [authenticated, privyUser, ready]);

  // Set up Supabase auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user && authenticated && privyUser) {
          setTimeout(() => {
            createOrUpdateProfile(session.user.id, privyUser);
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [authenticated, privyUser]);

  const createOrUpdateProfile = async (userId: string, privyUserData: any) => {
    try {
      // Extract user data from Privy
      const farcasterAccount = privyUserData.linkedAccounts?.find(
        (acc: any) => acc.type === 'farcaster'
      );
      const twitterAccount = privyUserData.linkedAccounts?.find(
        (acc: any) => acc.type === 'twitter_oauth'
      );
      const emailAccount = privyUserData.linkedAccounts?.find(
        (acc: any) => acc.type === 'email'
      );
      const walletAccount = privyUserData.linkedAccounts?.find(
        (acc: any) => acc.type === 'wallet'
      );

      const displayName = 
        farcasterAccount?.displayName || 
        twitterAccount?.name || 
        emailAccount?.address?.split('@')[0] || 
        'User';

      const avatarUrl = 
        farcasterAccount?.pfp || 
        twitterAccount?.profilePictureUrl || 
        null;

      const profileData = {
        user_id: userId,
        display_name: displayName,
        avatar_url: avatarUrl,
        wallet_address: walletAddress || walletAccount?.address,
        farcaster_username: farcasterAccount?.username,
        farcaster_fid: farcasterAccount?.fid,
        bio: farcasterAccount?.bio || twitterAccount?.bio,
      };

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!existingProfile) {
        await supabase.from('profiles').insert(profileData);
      } else {
        // Only update fields that have new values
        const updateData: any = {};
        Object.entries(profileData).forEach(([key, value]) => {
          if (value && key !== 'user_id') {
            updateData[key] = value;
          }
        });
        
        if (Object.keys(updateData).length > 0) {
          await supabase.from('profiles').update(updateData).eq('user_id', userId);
        }
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading: loading || !ready,
    privyUser,
    privyAuthenticated: authenticated,
    walletAddress,
    login,
    logout: handleLogout,
    signOut: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
