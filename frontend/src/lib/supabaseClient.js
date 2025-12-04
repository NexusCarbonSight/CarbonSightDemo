// src/lib/supabaseClient.js (or wherever your file lives)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Supabase will redirect back here after OAuth
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});

// ❌ No more hard-coded "sasol" org.
// If you ever want a default org, set REACT_APP_DEFAULT_ORG_SLUG in .env
export const getDefaultOrgSlug = () =>
  process.env.REACT_APP_DEFAULT_ORG_SLUG || null;



