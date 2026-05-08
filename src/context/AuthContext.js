'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    console.log('[AuthContext] Mounting...');

    // Emergency timeout to prevent infinite loading spinner
    const timeout = setTimeout(() => {
      if (mounted) {
        console.log('[AuthContext] Emergency timeout reached. Force setting loading false.');
        setLoading(false);
      }
    }, 3000);

    const getSession = async () => {
      try {
        console.log('[AuthContext] Calling supabase.auth.getUser()...');
        const { data, error } = await supabase.auth.getUser();
        console.log('[AuthContext] getUser result:', { user: data?.user, error });
        const currentUser = data?.user || null;
        
        if (mounted) {
          setUser(currentUser);
        }

        if (currentUser) {
          console.log('[AuthContext] Fetching profile...');
          await fetchProfile(currentUser.id);
          console.log('[AuthContext] Profile fetched.');
        }
      } catch (err) {
        console.error('Error getting session:', err);
      } finally {
        if (mounted) {
          console.log('[AuthContext] Setting loading to false in finally block.');
          setLoading(false);
          clearTimeout(timeout);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('[AuthContext] onAuthStateChange event:', event);
          const currentUser = session?.user ?? null;
          if (mounted) setUser(currentUser);
          
          if (currentUser) {
            await fetchProfile(currentUser.id);
          } else {
            if (mounted) setProfile(null);
          }
        } catch (err) {
          console.error('Error on auth state change:', err);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    );

    return () => {
      console.log('[AuthContext] Unmounting...');
      mounted = false;
      subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: { message: 'Not logged in' } };
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();
        
      if (!error) setProfile(data);
      return { data, error };
    } catch (err) {
      console.error('updateProfile error:', err);
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile: () => user && fetchProfile(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
