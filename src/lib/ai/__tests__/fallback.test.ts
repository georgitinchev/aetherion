import { APICallError, type LanguageModelV4 } from "@ai-sdk/provider";
import { describe, expect, it, vi } from "vitest";
import { isModelUnavailable, pickModels, withFallback } from "../fallback";

const apiError = (statusCode: number, responseBody = "") =>
  new APICallError({ message: "failed", url: "https://api.groq.com", requestBodyValues: {}, statusCode, responseBody });

function fakeModel(modelId: string, result: unknown | Error): LanguageModelV4 {
  const run = vi.fn(async () => {
    if (result instanceof Error) throw result;
    return result;
  });
  return {
    specificationVersion: "v4",
    provider: "groq",
    modelId,
    supportedUrls: {},
    doGenerate: run,
    doStream: run,
  } as unknown as LanguageModelV4;
}

const callOptions = {} as Parameters<LanguageModelV4["doGenerate"]>[0];

describe("withFallback", () => {
  it("uses the first model when it works", async () => {
    const a = fakeModel("a", "from a");
    const b = fakeModel("b", "from b");
    expect(await withFallback([a, b]).doGenerate(callOptions)).toBe("from a");
    expect(b.doGenerate).not.toHaveBeenCalled();
  });

  it("falls back on rate limits, retired models and outages", async () => {
    for (const error of [apiError(429), apiError(404), apiError(503), apiError(400, '{"code":"model_decommissioned"}')]) {
      const model = withFallback([fakeModel("a", error), fakeModel("b", "from b")]);
      expect(await model.doStream(callOptions)).toBe("from b");
    }
  });

  it("does not fall back on errors another model would not fix", async () => {
    const b = fakeModel("b", "from b");
    const model = withFallback([fakeModel("a", apiError(400, '{"code":"json_validate_failed"}')), b]);
    await expect(model.doGenerate(callOptions)).rejects.toThrow("failed");
    expect(b.doGenerate).not.toHaveBeenCalled();
  });

  it("rethrows the last error when every model is unavailable", async () => {
    const model = withFallback([fakeModel("a", apiError(429)), fakeModel("b", apiError(429))]);
    await expect(model.doGenerate(callOptions)).rejects.toSatisfy(isModelUnavailable);
  });
});

describe("pickModels", () => {
  const preferred = ["big", "small"];

  it("keeps preferred order and drops retired models", () => {
    expect(pickModels(preferred, new Set(["small", "other"]))).toEqual(["small"]);
    expect(pickModels(preferred, new Set(["small", "big"]))).toEqual(["big", "small"]);
  });

  it("returns the preferred list when the live list is unknown or has none of them", () => {
    expect(pickModels(preferred, null)).toEqual(preferred);
    expect(pickModels(preferred, new Set(["other"]))).toEqual(preferred);
  });
});
