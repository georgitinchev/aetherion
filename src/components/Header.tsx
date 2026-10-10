"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { rankFor, totalXp } from "@/lib/domain/progress";
import { useJourneys } from "@/lib/store/hooks";
import { useSession } from "./providers/SessionProvider";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="size-3 rotate-45 rounded-[3px] border border-holo bg-holo/20 shadow-[0_0_12px_var(--holo)] transition-transform group-hover:rotate-[135deg]" />
          <span className="font-mono text-sm font-semibold tracking-[0.3em]">AETHERION</span>
        </Link>
        <div className="flex items-center gap-3">
          <XpBadge />
          <ThemeToggle />
          <AccountButton />
        </div>
      </div>
    </header>
  );
}

function XpBadge() {
  const { journeys } = useJourneys();
  if (!journeys?.length) return null;
  const xp = totalXp(journeys);
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs"
      title={`${xp} XP`}
    >
      <span className="text-gold">◆</span>
      <span className="font-bold tabular-nums">{xp}</span>
      <span className="hidden text-muted sm:inline">· {rankFor(xp).name}</span>
    </div>
  );
}

function AccountButton() {
  const { user, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!user) return null;

  const label = user.email ?? "Account";
  return (
    <div ref={menu} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex size-9 items-center justify-center rounded-full border-2 border-holo/50 bg-holo/10 text-sm font-bold uppercase"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {label[0]}
      </button>
      {open && (
        <div className="card absolute right-0 mt-2 w-60 p-2 shadow-2xl">
          <p className="truncate px-3 py-2 text-xs text-muted">{label}</p>
          <button
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
