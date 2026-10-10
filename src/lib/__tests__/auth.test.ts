import { describe, expect, it } from "vitest";
import { safeNext } from "../auth";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/journey/abc")).toBe("/journey/abc");
    expect(safeNext("/journey/abc/trial/2?x=1")).toBe("/journey/abc/trial/2?x=1");
  });

  it("falls back to home for anything that could leave the site", () => {
    for (const bad of [null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "journey"]) {
      expect(safeNext(bad)).toBe("/");
    }
  });
});
