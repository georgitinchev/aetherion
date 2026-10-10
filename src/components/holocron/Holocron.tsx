"use client";

import dynamic from "next/dynamic";
import type { HolocronState } from "./HolocronScene";

export type { HolocronState };

// WebGL only exists in the browser; render a soft glow until the scene loads.
const HolocronScene = dynamic(() => import("./HolocronScene"), {
  ssr: false,
  loading: () => <Placeholder />,
});

function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="size-1/3 rotate-45 rounded-xl border border-holo/30 bg-holo/5 shadow-[0_0_80px_rgb(92_200_255/0.25)]" />
    </div>
  );
}

export function Holocron({
  state = "idle",
  className = "",
}: {
  state?: HolocronState;
  className?: string;
}) {
  return (
    <div
      className={`relative ${className}`}
      // Fade the canvas edges so the bloom melts into the page.
      style={{
        maskImage: "radial-gradient(circle at center, black 45%, transparent 72%)",
        WebkitMaskImage: "radial-gradient(circle at center, black 45%, transparent 72%)",
      }}
      aria-hidden
    >
      <div
        className={`absolute inset-[22%] rounded-full bg-holo/25 blur-3xl transition-opacity duration-700 ${state === "channeling" ? "opacity-100" : "opacity-50"}`}
      />
      <HolocronScene state={state} />
    </div>
  );
}
