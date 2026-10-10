"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { JourneyStore } from "@/lib/store/journeys";
import { getSupabase } from "@/lib/supabase/browser";

type Session = {
  /** Null while loading, and on the login page. */
  user: User | null;
  store: JourneyStore | null;
  /** Bumped whenever journeys change, so every list (e.g. the header XP) refetches. */
  revision: number;
  markChanged(): void;
  signOut(): Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [revision, setRevision] = useState(0);
  const markChanged = useCallback(() => setRevision((r) => r + 1), []);

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
      revision,
      markChanged,
      signOut: async () => {
        await getSupabase().auth.signOut();
      },
    }),
    [user, revision, markChanged],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const ctx = use(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
