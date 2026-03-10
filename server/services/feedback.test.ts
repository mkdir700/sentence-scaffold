import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGenerateContent = vi.hoisted(() => vi.fn());

vi.mock("@google/genai", () => ({
  GoogleGenAI: function () {
    return {
      models: {
        generateContent: mockGenerateContent,
      },
    };
  },
}));

import { getFeedback } from "./feedback.js";

const testParams = {
  userTranslation: "Despite the rain, we went out.",
  reference: "Despite the heavy rain, we still went out.",
  hint: "use despite",
  cn: "尽管下雨，我们还是出去了。",
};

describe("getFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns commentary when Gemini responds successfully", async () => {
    mockGenerateContent.mockResolvedValue({ text: "结构正确，用法恰当。" });

    const result = await getFeedback(testParams);
    expect(result).toEqual({ commentary: "结构正确，用法恰当。" });
  });

  it("throws when response.text is null", async () => {
    mockGenerateContent.mockResolvedValue({ text: null });

    await expect(getFeedback(testParams)).rejects.toThrow("Failed to generate feedback");
  });
});
