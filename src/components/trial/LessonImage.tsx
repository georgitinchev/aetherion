"use client";

import { useEffect, useState } from "react";
import { findCommonsImage, type CommonsImage } from "@/lib/images/commons";

/** A Wikimedia Commons picture for `query`, credited; renders nothing if none is found. */
export function LessonImage({ query, caption }: { query: string; caption: string }) {
  const [image, setImage] = useState<CommonsImage | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    findCommonsImage(query)
      .then((found) => !cancelled && setImage(found))
      .catch(() => !cancelled && setImage(null));
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (image === null) return null;
  if (image === undefined) {
    return <span className="my-6 block h-56 animate-pulse rounded-2xl bg-surface-2" aria-label="Loading image" />;
  }

  return (
    <figure className="my-6">
      <a href={image.pageUrl} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote, already-sized Commons thumbnail */}
        <img
          src={image.url}
          alt={caption}
          loading="lazy"
          className="mx-auto max-h-96 w-auto rounded-2xl border border-border bg-white object-contain p-2"
        />
      </a>
      <figcaption className="mt-2 text-center text-xs text-muted">
        {caption}
        <span className="block text-faint">
          {image.author} · {image.license} · via{" "}
          <a href={image.pageUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Wikimedia Commons
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
