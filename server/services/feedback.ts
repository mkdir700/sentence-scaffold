import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getFeedback(params: {
  userTranslation: string;
  reference: string;
  hint: string;
  cn: string;
}): Promise<{ commentary: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `用户将以下中文翻译成英文：
中文原句：${params.cn}
提示：${params.hint}
用户译文：${params.userTranslation}
参考译文：${params.reference}

请用1-2句中文点评用户的翻译，指出结构是否正确，必要时说明参考译文与用户译文的关键区别。直接给出点评，不要重复题目内容。`,
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate feedback");
  }

  return { commentary: text.trim() };
}
