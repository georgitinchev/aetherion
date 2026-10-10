import { describe, expect, it } from "vitest";
import { fromMarkdown } from "mdast-util-from-markdown";
import { candidateQueries, commonsSearchUrl, decodeImageQuery, encodeImageRefs, pickCommonsImage } from "../commons";

const page = (index: number, mime: string, thumburl?: string) => ({
  index,
  imageinfo: [
    {
      mime,
      thumburl,
      descriptionurl: `https://commons.wikimedia.org/wiki/File:${index}`,
      extmetadata: {
        Artist: { value: '<a href="/wiki/User:Kelvinsong">Kelvinsong</a>' },
        LicenseShortName: { value: "CC BY-SA 3.0" },
      },
    },
  ],
});

describe("pickCommonsImage", () => {
  it("returns the best-ranked usable picture with clean attribution", () => {
    const response = {
      query: {
        pages: {
          b: page(2, "image/png", "https://thumb/2.png"),
          a: page(1, "image/svg+xml", "https://thumb/1.png"),
        },
      },
    };
    expect(pickCommonsImage(response)).toEqual({
      url: "https://thumb/1.png",
      pageUrl: "https://commons.wikimedia.org/wiki/File:1",
      author: "Kelvinsong",
      license: "CC BY-SA 3.0",
    });
  });

  it("skips videos, documents and results without a thumbnail", () => {
    const response = {
      query: {
        pages: {
          a: page(1, "video/webm", "https://thumb/1.jpg"),
          b: page(2, "application/pdf", "https://thumb/2.jpg"),
          c: page(3, "image/jpeg"),
          d: page(4, "image/jpeg", "https://thumb/4.jpg"),
        },
      },
    };
    expect(pickCommonsImage(response)?.url).toBe("https://thumb/4.jpg");
  });

  it("returns null when nothing matches", () => {
    expect(pickCommonsImage({})).toBeNull();
    expect(pickCommonsImage({ query: { pages: {} } })).toBeNull();
  });
});

describe("commonsSearchUrl", () => {
  it("searches the File namespace, allows browser CORS and asks for a thumbnail", () => {
    const url = new URL(commonsSearchUrl("human heart diagram"));
    expect(url.searchParams.get("gsrsearch")).toBe("human heart diagram filetype:bitmap|drawing");
    expect(url.searchParams.get("gsrnamespace")).toBe("6");
    expect(url.searchParams.get("origin")).toBe("*");
    expect(url.searchParams.get("iiurlwidth")).toBe("900");
  });
});

describe("encodeImageRefs", () => {
  it("turns natural-language image references into parseable Markdown images", () => {
    const md = encodeImageRefs("Look: ![Heart chambers](image:human heart anatomy diagram) and [a link](https://x.org)");
    const paragraph = fromMarkdown(md).children[0] as { children: { type: string; url?: string }[] };
    const image = paragraph.children.find((c) => c.type === "image");
    expect(image && decodeImageQuery(image.url!)).toBe("human heart anatomy diagram");
    expect(md).toContain("[a link](https://x.org)");
  });
});

describe("candidateQueries", () => {
  it("falls back from the full phrase to key words to the first three key words", () => {
    expect(candidateQueries("human heart chambers and major vessels diagram")).toEqual([
      "human heart chambers and major vessels diagram",
      "human heart chambers major vessels diagram",
      "human heart chambers",
    ]);
  });

  it("does not repeat identical searches for short phrases", () => {
    expect(candidateQueries("Mona Lisa")).toEqual(["Mona Lisa"]);
  });
});
