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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Create profile if user signs in and doesn't have one
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            createOrUpdateProfile(session.user);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createOrUpdateProfile = async (user: User) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          user_id: user.id,
          display_name: user.user_metadata.display_name || user.email?.split('@')[0] || 'User',
          farcaster_username: user.user_metadata.farcaster_username,
          farcaster_fid: user.user_metadata.farcaster_fid,
          wallet_address: user.user_metadata.wallet_address,
        });
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const signInWithFarcaster = async (farcasterData: any) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${farcasterData.fid}@farcaster.local`,
        password: farcasterData.signature,
      });

      if (error && error.message.includes('Invalid login credentials')) {
        // User doesn't exist, create account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: `${farcasterData.fid}@farcaster.local`,
          password: farcasterData.signature,
          options: {
            data: {
              display_name: farcasterData.displayName,
              farcaster_username: farcasterData.username,
              farcaster_fid: farcasterData.fid,
              wallet_address: farcasterData.custodyAddress,
            }
          }
        });

        if (signUpError) throw signUpError;
      } else if (error) {
        throw error;
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