"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { ProtectedRoute } from "@/components/protected-route";

/**
 * App Layout Component
 * 
 * Conditionally shows sidebar and protects routes.
 * - Login/Register pages: No sidebar, no protection
 * - All other pages: Sidebar + ProtectedRoute
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Auth pages (login/register) - no sidebar, no protection
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected pages - show sidebar and protect route
  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          <ProtectedRoute>{children}</ProtectedRoute>
        </div>
      </main>
    </>
  );
}
