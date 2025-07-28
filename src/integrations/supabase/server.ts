// src/integrations/supabase/server.ts
import { createClient } from "@supabase/supabase-js";

// Ensure these are loaded from environment variables (e.g., .env.local, .env.production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single Supabase client for server-side operations
// This client is typically used for read-only operations on the server
// For authenticated server-side operations, you might use service_role key or
// handle sessions differently. For initial page load, anon key is usually sufficient.
export const createServerSupabaseClient = () => {
    return createClient(supabaseUrl, supabaseAnonKey);
};
