

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithFarcaster: (farcasterData: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, nextSession) => {
            if (!mounted) return;
            setSession(nextSession);
            setUser(nextSession?.user ?? null);
            setLoading(false);

            if (event === 'SIGNED_IN' && nextSession?.user) {
              setTimeout(() => {
                void createOrUpdateProfile(nextSession.user);
              }, 0);
            }
          }
        );

        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (!mounted) {
          subscription.unsubscribe();
          return;
        }

        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        setLoading(false);

        if (!existingSession) {
          setTimeout(async () => {
            try {
              const { sdk } = await import('@farcaster/miniapp-sdk');
              const context = await Promise.race([
                sdk.context,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Farcaster context timeout')), 2500)),
              ]);

              const sdkUser = (context as any)?.user;
              if (sdkUser?.fid) {
                await signInWithFarcaster({
                  fid: sdkUser.fid,
                  username: sdkUser.username,
                  displayName: sdkUser.displayName || sdkUser.username,
                  pfpUrl: sdkUser.pfpUrl,
                  custodyAddress: '',
                });
                return;
              }
            } catch (farcasterAuthError) {
              console.warn('Farcaster auto-auth unavailable:', farcasterAuthError);
            }

            try {
              await supabase.auth.signInAnonymously();
            } catch (anonError) {
              console.warn('Anonymous sign in unavailable:', anonError);
            }
          }, 0);
        }

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const createOrUpdateProfile = async (user: User) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          user_id: user.id,
          display_name: user.user_metadata.display_name || user.email?.split('@')[0] || 'User',
          farcaster_username: user.user_metadata.farcaster_username,
          farcaster_fid: user.user_metadata.farcaster_fid ? parseInt(user.user_metadata.farcaster_fid) : null,
          wallet_address: user.user_metadata.wallet_address,
          avatar_url: user.user_metadata.avatar_url,
        });
      } else {
        // Update existing profile with new data
        await supabase.from('profiles').update({
          display_name: user.user_metadata.display_name || existingProfile.display_name,
          farcaster_username: user.user_metadata.farcaster_username || existingProfile.farcaster_username,
          farcaster_fid: user.user_metadata.farcaster_fid ? parseInt(user.user_metadata.farcaster_fid) : existingProfile.farcaster_fid,
          wallet_address: user.user_metadata.wallet_address || existingProfile.wallet_address,
          avatar_url: user.user_metadata.avatar_url || existingProfile.avatar_url,
        }).eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const signInWithFarcaster = async (farcasterData: any) => {
    try {
      // Create an anonymous session if not already signed in
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      if (!existingSession) {
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
      }

      // Update user metadata with Farcaster data
      const { data: updated, error: updateError } = await supabase.auth.updateUser({
        data: {
          display_name: farcasterData.displayName,
          farcaster_username: farcasterData.username,
          farcaster_fid: String(farcasterData.fid),
          wallet_address: farcasterData.custodyAddress,
          avatar_url: farcasterData.pfpUrl,
        },
      });
      if (updateError) throw updateError;

      // Fetch and store full profile data from Neynar
      if (updated.user && farcasterData.fid) {
        setTimeout(async () => {
          try {
            const { data: profileData } = await supabase.functions.invoke(
              'sync-farcaster-profile',
              { body: { fid: farcasterData.fid } }
            );

            if (profileData?.success && profileData.profile) {
              // Update profile with full data including bio
              await supabase.from('profiles').upsert({
                user_id: updated.user.id,
                farcaster_fid: farcasterData.fid,
                farcaster_username: profileData.profile.username,
                display_name: profileData.profile.displayName,
                avatar_url: profileData.profile.pfpUrl,
                bio: profileData.profile.bio,
                wallet_address: profileData.profile.custodyAddress,
              }, { onConflict: 'user_id' });
            }
          } catch (error) {
            console.error('Error syncing Farcaster profile:', error);
          }
        }, 0);

        // Also ensure there's a basic profile row
        await createOrUpdateProfile(updated.user);
      }
    } catch (error) {
      console.error('Farcaster sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signInWithFarcaster,
    signOut,
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
