// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDefaultOrgSlug, supabase } from '../lib/supabaseClient';

const AuthContext = createContext(undefined);

async function ensureProfile(user, fallbackOrgId, preferredRole = null) {
  if (!user) {
    console.log('ensureProfile: no user provided');
    return null;
  }

  console.log('ensureProfile: checking profile for user:', user.id);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('ensureProfile: error fetching profile:', error);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  // 🔹 Existing profile
  if (data) {
    console.log('ensureProfile: found existing profile:', data);

    const updates = {};

    // Fill org_id if missing and we have a default org
    if (!data.org_id && fallbackOrgId && ['company', 'regulator', 'admin'].includes(data.role)) {
      console.log('ensureProfile: profile missing org_id, setting fallback org:', fallbackOrgId);
      updates.org_id = fallbackOrgId;
    }

    // If role is NULL and we have a preferredRole, set it (but do NOT override non-null)
    if (!data.role && preferredRole && preferredRole !== 'public') {
      console.log('ensureProfile: profile missing role, setting preferredRole:', preferredRole);
      updates.role = preferredRole;
    }

    if (Object.keys(updates).length > 0) {
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('ensureProfile: error updating profile:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      console.log('ensureProfile: updated profile:', updated);
      return updated;
    }

    return data;
  }

  // 🔹 No profile yet – create one
  const role = preferredRole || 'public';

  console.log('ensureProfile: creating new profile for user:', user.id, 'role:', role);

  const profilePayload = {
    id: user.id,
    role,
    display_name:
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'User',
    metadata: user.user_metadata || {},
  };

  if (!profilePayload.metadata.default_org_slug) {
    profilePayload.metadata.default_org_slug = getDefaultOrgSlug();
  }

  if (fallbackOrgId && ['company', 'regulator', 'admin'].includes(role)) {
    profilePayload.org_id = fallbackOrgId;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert(profilePayload)
    .select()
    .single();

  if (insertError) {
    // Handle "duplicate key" race conditions gracefully
    if (insertError.code === '23505') {
      console.warn('ensureProfile: duplicate profile insert, refetching existing row...');
      const { data: existing, error: refetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (refetchError) {
        console.error('ensureProfile: refetch error after duplicate:', refetchError);
        throw new Error('Profile exists but cannot be accessed. Please contact administrator.');
      }

      return existing;
    }

    console.error('ensureProfile: error inserting profile:', insertError);
    throw new Error(`Failed to create profile: ${insertError.message}`);
  }

  console.log('ensureProfile: created profile:', inserted);
  return inserted;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grantedAccess, setGrantedAccess] = useState(null);

  const fetchOrgIdBySlug = async (slug) => {
    const { data, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (orgError) {
      console.warn('AuthContext: failed to resolve org by slug', orgError);
    }

    return data?.id ?? null;
  };

  const loadProfile = async (user) => {
    try {
      console.log('AuthContext: loading profile for user:', user?.id);

      const defaultOrgSlug = getDefaultOrgSlug();
      const defaultOrgId = defaultOrgSlug ? await fetchOrgIdBySlug(defaultOrgSlug) : null;

      // 🔹 Read intendedRole from sessionStorage OR URL (?role=company/regulator)
      let intendedRole = null;
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = urlParams.get('role');
        const storedRole = sessionStorage.getItem('intended_role');
        intendedRole = storedRole || urlRole || null;
        console.log('AuthContext: intendedRole for loadProfile:', intendedRole);
      } catch {
        // ignore if window is not available
      }

      const ensuredProfile = await ensureProfile(user, defaultOrgId, intendedRole);
      setProfile(ensuredProfile);
      setError(null);
      return ensuredProfile;
    } catch (profileError) {
      console.error('AuthContext: failed to load profile:', profileError);
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

        if (sessionError) throw sessionError;
        if (!isMounted) return;

        setSession(currentSession);

        if (currentSession?.user) {
          await loadProfile(currentSession.user);
        }
      } catch (initError) {
        console.error('AuthContext: initialisation failed', initError);
        setError(initError);
      } finally {
        if (isMounted) setLoading(false);
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
        setGrantedAccess(null);
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

  const signInWithGoogle = async () => {
    // 🔹 Get intended_role from sessionStorage (set by Company/RegulatorSignIn pages)
    let role = 'public';
    try {
      const stored = sessionStorage.getItem('intended_role');
      if (stored) role = stored;
    } catch {
      // ignore
    }

    const redirectTo = `${window.location.origin}/auth/callback?role=${encodeURIComponent(role)}`;
    console.log('AuthContext: Starting Google OAuth with redirectTo:', redirectTo);

    const { data, error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'email profile',
        redirectTo,
      },
    });

    if (signInError) {
      console.error('AuthContext: Google sign-in error:', signInError);
      throw signInError;
    }

    // Supabase will redirect away; we usually won't hit this line
    return data;
  };

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;

    setProfile(null);
    setGrantedAccess(null);
  };

  const refreshProfile = async () => {
    if (!session?.user) return null;
    return loadProfile(session.user);
  };

  const grantAccess = (accessType) => {
    console.log('AuthContext: granting access type:', accessType);
    setGrantedAccess(accessType);
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      error,
      grantedAccess,
      grantAccess,
      signInWithPassword,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, error, grantedAccess, grantAccess, signInWithPassword, signInWithGoogle, signOut, refreshProfile]
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


