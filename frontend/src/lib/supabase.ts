import { createClient } from '@supabase/supabase-js';

// Frontend Supabase client — uses anon key for read-only public access
// This client is subject to RLS policies
// Used for: reading published portfolios (ISR pages) and OG image generation

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
