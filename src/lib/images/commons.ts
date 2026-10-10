/**
 * Lesson images come from Wikimedia Commons, not an AI image model: the lesson
 * text only names what to show (`![caption](image:search terms)`) and the
 * browser looks up a freely licensed picture. No extra AI calls, no API key.
 */

export const IMAGE_SCHEME = "image:";

/**
 * Markdown doesn't allow spaces in a link target, so `![c](image:human heart)`
 * would render as plain text. Encode the search terms before parsing.
 */
export function encodeImageRefs(markdown: string): string {
  return markdown.replace(
    /\]\(image:([^)\n]+)\)/g,
    (_, query: string) => `](${IMAGE_SCHEME}${encodeURIComponent(query.trim())})`,
  );
}

export function decodeImageQuery(src: string): string {
  const raw = src.slice(IMAGE_SCHEME.length);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export type CommonsImage = {
  url: string;
  pageUrl: string;
  author: string;
  license: string;
};

const API = "https://commons.wikimedia.org/w/api.php";
const SUPPORTED = new Set(["image/jpeg", "image/png", "image/svg+xml", "image/webp", "image/gif"]);

export function commonsSearchUrl(query: string, width = 900): string {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: query,
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: String(width),
  });
  return `${API}?${params}`;
}

type CommonsResponse = {
  query?: {
    pages?: Record<
      string,
      {
        index?: number;
        imageinfo?: {
          mime?: string;
          thumburl?: string;
          descriptionurl?: string;
          extmetadata?: Record<string, { value?: string }>;
        }[];
      }
    >;
  };
};

const stripHtml = (s = "") => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/** Best-ranked result that is an actual picture with a usable thumbnail, or null. */
export function pickCommonsImage(response: unknown): CommonsImage | null {
  const pages = Object.values((response as CommonsResponse)?.query?.pages ?? {});
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl || !info.descriptionurl || !SUPPORTED.has(info.mime ?? "")) continue;
    const meta = info.extmetadata ?? {};
    return {
      url: info.thumburl,
      pageUrl: info.descriptionurl,
      author: stripHtml(meta.Artist?.value) || "Unknown author",
      license: stripHtml(meta.LicenseShortName?.value) || "see source",
    };
  }
  return null;
}

const CACHE_PREFIX = "aetherion:img:";

/** Looks up an image once per browser; results (including misses) are cached locally. */
export async function findCommonsImage(query: string): Promise<CommonsImage | null> {
  const key = CACHE_PREFIX + query.toLowerCase();
  try {
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached) as CommonsImage | null;
  } catch {
    // Storage unavailable: just fetch.
  }
  const res = await fetch(commonsSearchUrl(query));
  if (!res.ok) return null;
  const image = pickCommonsImage(await res.json());
  try {
    localStorage.setItem(key, JSON.stringify(image));
  } catch {
    // Not cached, that's fine.
  }
  return image;
}
