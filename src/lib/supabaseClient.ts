import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

const hasRealSupabaseUrl = Boolean(
  supabaseUrl &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl.trim()) &&
    !supabaseUrl.includes("seu-projeto"),
);
const hasRealSupabaseKey = Boolean(
  supabaseKey && !/sua-chave|your-|placeholder/i.test(supabaseKey),
);

export const isSupabaseConfigured = hasRealSupabaseUrl && hasRealSupabaseKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
