"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, User, AuthResponse } from "./api";

/**
 * Auth Context
 *
 * Provides authentication state and methods throughout the app.
 * Accounts live in the backend (/auth/*); the token is kept in localStorage.
 */

interface AuthContextType {
  // Current user (null if not logged in)
  user: User | null;
  // Loading state while checking auth
  isLoading: boolean;
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider - wrap your app with this to enable auth
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore the session from a stored token
    api.getMe()
      .then((me) => {
        if (!me) api.setToken(null); // expired or unknown user
        setUser(me);
      })
      .catch((error) => console.warn("Failed to restore session:", error))
      .finally(() => setIsLoading(false));
  }, []);

  /** Store the token from register/login and set the user */
  const authenticate = async (request: Promise<AuthResponse>) => {
    try {
      const { access_token, user } = await request;
      api.setToken(access_token);
      setUser(user);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = (email: string, password: string) =>
    authenticate(api.login(email, password));

  /**
   * Sign up with email and password (signs the new account in)
   */
  const signUp = (email: string, password: string) =>
    authenticate(api.register(email, password));

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    api.setToken(null);
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 *
 * Usage:
 * const { user, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
