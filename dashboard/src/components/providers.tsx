"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth-context";

/**
 * Providers component wraps the entire app with necessary context providers.
 * 
 * Includes:
 * - AuthProvider: Supabase authentication state
 * - React Query: for data fetching, caching, and state management
 * 
 * Why useState for QueryClient?
 * - Ensures each user gets their own QueryClient instance
 * - Prevents data leaking between users in server-side rendering
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient once per app instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 30 seconds before refetching
            staleTime: 30 * 1000,
            // Don't refetch when user switches browser tabs
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthProvider>
  );
}

