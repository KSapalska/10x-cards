import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

// Support both regular env vars and PUBLIC_ prefixed ones (for Astro)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "c7e3c5fe-9c56-4d4e-8d2c-c30dadab9358";
