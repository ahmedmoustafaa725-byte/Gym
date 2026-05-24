import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mockAuthFlag = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isMockMode = mockAuthFlag || !isSupabaseConfigured;
export const shouldUseSupabase = isSupabaseConfigured && !mockAuthFlag;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;
