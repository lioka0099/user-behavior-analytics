/**
 * Supabase Client Configuration
 * 
 * Creates a browser-side Supabase client for authentication.
 * Uses environment variables for the project URL and anon key.
 * 
 * Setup instructions:
 * 1. Go to your Supabase project dashboard
 * 2. Navigate to Settings > API
 * 3. Copy the "Project URL" and "anon public" key
 * 4. Create a .env.local file in the dashboard folder with:
 *    NEXT_PUBLIC_SUPABASE_URL=your-project-url
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 */

import { createBrowserClient } from "@supabase/ssr";

// Validate environment variables at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables not set. " +
    "Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/**
 * Create a Supabase client for browser-side usage.
 * This client handles authentication state automatically.
 */
export function createClient() {
  return createBrowserClient(
    supabaseUrl || "",
    supabaseAnonKey || ""
  );
}

// Export a singleton instance for convenience
export const supabase = createClient();
