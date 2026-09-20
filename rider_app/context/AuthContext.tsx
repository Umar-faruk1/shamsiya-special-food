import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  role: string;
  status: string;
};

type Rider = {
  id: string;
  approval_status: "pending" | "approved" | "rejected";
  rider_status: "active" | "inactive";
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Unable to connect. Check your internet connection and try again.";
  }
  return "Unable to sign in. Please try again.";
}

function logAuthError(error: unknown) {
  if (__DEV__) console.error("Rider authentication error:", error);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setSession(null);
    setUser(null);
  }, []);

  const verifyRider = useCallback(async (nextUser: User) => {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, status")
      .eq("id", nextUser.id)
      .maybeSingle();

    if (profileError) {
      logAuthError(profileError);
      return "Unable to verify rider access right now.";
    }

    if (!profile) return "This account is not registered as a rider.";

    const verifiedProfile = profile as Profile;
    if (verifiedProfile.role !== "rider") {
      return "This account is not registered as a rider.";
    }
    if (verifiedProfile.status !== "active") {
      return "Your rider account is not currently active.";
    }

    const { data: rider, error: riderError } = await supabase
      .from("riders")
      .select("id, approval_status, rider_status")
      .eq("id", nextUser.id)
      .maybeSingle();

    if (riderError) {
      logAuthError(riderError);
      return "Unable to verify rider access right now.";
    }

    if (!rider) return "This account is not registered as a rider.";

    const verifiedRider = rider as Rider;
    if (verifiedRider.approval_status !== "approved") {
      if (verifiedRider.approval_status === "pending") {
        return "Your rider account has not been approved.";
      }
      return "Your rider account is not approved.";
    }
    if (verifiedRider.rider_status !== "active") {
      return "Your rider account is not currently active.";
    }

    return null;
  }, []);

  const rejectSession = useCallback(
    async (message: string) => {
      await supabase.auth.signOut();
      clearAuth();
      setLoading(false);
      return message;
    },
    [clearAuth],
  );

  const restoreSession = useCallback(
    async (nextSession: Session | null) => {
      if (!nextSession?.user) {
        clearAuth();
        setLoading(false);
        return;
      }

      const verificationError = await verifyRider(nextSession.user);
      if (verificationError) {
        await rejectSession(verificationError);
        return;
      }

      setSession(nextSession);
      setUser(nextSession.user);
      setLoading(false);
    },
    [clearAuth, rejectSession, verifyRider],
  );

  useEffect(() => {
    let mounted = true;

    void supabase.auth
      .getSession()
      .then(({ data: { session: nextSession } }) => {
        if (mounted) void restoreSession(nextSession);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mounted) return;
        if (event === "SIGNED_OUT") {
          clearAuth();
          setLoading(false);
        } else if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") {
          void restoreSession(nextSession);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [clearAuth, restoreSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        setLoading(false);
        return "Enter your email and password to continue.";
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (error || !data.session) {
        setLoading(false);
        if (error) logAuthError(error);
        return authErrorMessage(error?.message ?? "Missing session");
      }

      const verificationError = await verifyRider(data.session.user);
      if (verificationError) return rejectSession(verificationError);

      setSession(data.session);
      setUser(data.session.user);
      setLoading(false);
      return null;
    },
    [rejectSession, verifyRider],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    clearAuth();
    if (error) {
      logAuthError(error);
      return "Unable to sign out. Please try again.";
    }
    return null;
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
