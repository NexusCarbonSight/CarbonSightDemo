import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getDefaultOrgSlug, supabase } from '../lib/supabaseClient';

const AuthContext = createContext(undefined);

async function ensureProfile(user, fallbackOrgId) {
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  const profilePayload = {
    id: user.id,
    role: 'public',
    display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Guest',
    metadata: user.user_metadata || {},
  };

  if (!profilePayload.metadata.default_org_slug) {
    profilePayload.metadata.default_org_slug = getDefaultOrgSlug();
  }

  if (fallbackOrgId) {
    profilePayload.org_id = fallbackOrgId;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert(profilePayload)
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrgIdBySlug = async (slug) => {
    const { data, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (orgError) {
      console.warn('Failed to resolve organization by slug', orgError);
    }

    return data?.id ?? null;
  };

  const loadProfile = async (user) => {
    try {
      const defaultOrgSlug = getDefaultOrgSlug();
      const defaultOrgId = defaultOrgSlug ? await fetchOrgIdBySlug(defaultOrgSlug) : null;
      const ensuredProfile = await ensureProfile(user, defaultOrgId);
      setProfile(ensuredProfile);
      setError(null);
      return ensuredProfile;
    } catch (profileError) {
      console.error('Failed to load profile', profileError);
      setProfile(null);
      setError(profileError);
      throw profileError;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!isMounted) return;

        setSession(currentSession);

        if (currentSession?.user) {
          await loadProfile(currentSession.user);
        }
      } catch (initError) {
        console.error('Auth initialisation failed', initError);
        setError(initError);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithPassword = async ({ email, password }) => {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      throw signInError;
    }
    if (data.session?.user) {
      await loadProfile(data.session.user);
    }
    return data;
  };

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw signOutError;
    }
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!session?.user) return null;
    return loadProfile(session.user);
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      error,
      signInWithPassword,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

