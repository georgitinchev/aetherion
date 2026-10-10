"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from "react";
import { JourneyStore } from "@/lib/store/journeys";
import { getSupabase } from "@/lib/supabase/browser";

type Session = {
  /** Null while loading, and on the login page. */
  user: User | null;
  store: JourneyStore | null;
  signOut(): Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_OUT") {
        router.replace("/login");
        router.refresh();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  const value = useMemo<Session>(
    () => ({
      user,
      store: user ? new JourneyStore(getSupabase(), user.id) : null,
      signOut: async () => {
        await getSupabase().auth.signOut();
      },
    }),
    [user],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const ctx = use(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
