"use client";

import { useEffect, useId, useState } from "react";

/**
 * Renders a ```mermaid block as an SVG diagram. Mermaid is large, so it is only
 * downloaded when a lesson actually contains a diagram. With securityLevel
 * "strict" Mermaid sanitizes its own output, so model-written labels can't
 * inject markup.
 */
export function MermaidDiagram({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        const light = document.documentElement.dataset.theme === "light";
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: light ? "default" : "dark",
          fontFamily: "inherit",
        });
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled) setSvg(svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  // A diagram the model got wrong still shows its source rather than vanishing.
  if (failed) {
    return (
      <pre>
        <code>{chart}</code>
      </pre>
    );
  }
  if (!svg) return <div className="my-6 h-40 animate-pulse rounded-2xl bg-surface-2" aria-label="Loading diagram" />;
  return (
    <div
      className="my-6 flex justify-center overflow-x-auto rounded-2xl border border-border bg-surface p-4 [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
