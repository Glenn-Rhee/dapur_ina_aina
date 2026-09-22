import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";

/** Supabase client untuk Client Component (browser). */
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key);
}
