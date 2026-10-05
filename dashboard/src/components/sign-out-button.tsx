"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

/**
 * Sign-out button. After signing out, ProtectedRoute redirects to /login.
 */
export function SignOutButton({ className }: { className?: string }) {
  const { signOut } = useAuth();

  return (
    <Button variant="outline" size="sm" onClick={signOut} className={className}>
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
