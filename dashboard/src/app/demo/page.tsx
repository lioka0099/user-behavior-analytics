"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

// Public on purpose: anyone can use the shared demo account.
// Must match backend/scripts/seed_demo.py, which resets the account every night.
const DEMO_EMAIL = "demo@user-behavior-analytics.app";
const DEMO_PASSWORD = "try-the-demo";

/**
 * Demo Page
 *
 * Signs the visitor in to the shared demo account and opens the apps list.
 * If that fails, offers to create an account instead.
 */
export default function DemoPage() {
  const router = useRouter();
  const { signIn, isLoading } = useAuth();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // Wait for the stored-session check, which would otherwise overwrite the
    // demo sign-in, and sign in only once (React runs effects twice in dev).
    if (isLoading || started.current) return;
    started.current = true;
    signIn(DEMO_EMAIL, DEMO_PASSWORD).then(({ error }) => {
      if (error) setFailed(true);
      else router.replace("/apps");
    });
  }, [isLoading, signIn, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-600/20">
            {failed ? (
              <AlertCircle className="h-8 w-8 text-red-400" />
            ) : (
              <PlayCircle className="h-8 w-8 text-violet-400" />
            )}
          </div>
          <CardTitle className="text-2xl">{failed ? "Demo unavailable" : "Opening the demo"}</CardTitle>
          <CardDescription className="mt-2" role="status">
            {failed
              ? "The demo is unavailable right now. You can create a free account instead."
              : "Signing you in to the demo…"}
          </CardDescription>
        </CardHeader>
        {failed && (
          <CardContent className="text-center">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Create a free account
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
