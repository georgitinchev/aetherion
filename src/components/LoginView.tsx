"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Holocron } from "@/components/holocron/Holocron";
import { Spinner } from "@/components/ui/Spinner";
import { safeNext } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/browser";

type Mode = "signin" | "register";

const MIN_PASSWORD = 8;

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "confirmation" ? "That confirmation link is invalid or expired." : null,
  );
  const [checkEmail, setCheckEmail] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const auth = getSupabase().auth;
    const { data, error } =
      mode === "signin"
        ? await auth.signInWithPassword({ email, password })
        : await auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
          });
    setBusy(false);
    if (error) return setError(error.message);
    // With email confirmation enabled, sign-up returns no session until the link is clicked.
    if (!data.session) return setCheckEmail(true);
    router.replace(next);
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-2 pb-16">
      <Holocron className="aspect-square w-[min(80vw,380px)] -mb-6" />
      <p className="eyebrow">The holocron opens to members</p>
      <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {mode === "signin" ? "Welcome back, learner." : "Join the order."}
      </h1>
      <p className="mt-3 max-w-md text-center text-sm text-muted">
        Name any skill and the holocron turns it into a path of short lessons and quizzes. Your progress and XP are
        saved to your account.
      </p>

      <div className="card mt-8 w-full max-w-sm p-6">
        {checkEmail ? (
          <p className="text-sm">
            Check <span className="font-semibold">{email}</span> for a confirmation link, then come back here to sign
            in.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1 text-sm font-semibold" role="tablist">
              {(["signin", "register"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`rounded-xl py-2 transition-colors ${mode === m ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text"}`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                aria-label="Email"
                className="w-full rounded-2xl border-2 border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-faint focus:border-holo/60"
              />
              <input
                type="password"
                required
                minLength={mode === "register" ? MIN_PASSWORD : undefined}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? `Password (min. ${MIN_PASSWORD} characters)` : "Password"}
                aria-label="Password"
                className="w-full rounded-2xl border-2 border-border bg-bg px-4 py-3 text-sm outline-none placeholder:text-faint focus:border-holo/60"
              />
              <button type="submit" className="btn btn-primary w-full" disabled={busy}>
                {busy ? <Spinner /> : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          </>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
