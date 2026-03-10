import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/index.js";
import {
  checkSentence,
  saveSentence,
  getAnalysisById,
} from "./analysis.js";
import type { AnalysisResult } from "../../src/types/index.js";

const MOCK_ANALYSIS: AnalysisResult = {
  sentence: "The quick brown fox jumps over the lazy dog.",
  sentence_type: {
    category: "简单句",
    summary: "简单陈述句，主谓宾结构。",
  },
  main_clause: {
    subject: "The quick brown fox",
    verb: "jumps",
    complement: "over the lazy dog",
  },
  core_skeleton: "fox jumps",
  components: [
    { text: "The quick brown fox", role: "主语" },
    { text: "jumps", role: "谓语" },
    { text: "over the lazy dog", role: "状语" },
  ],
  structure_tree: [
    {
      label: "S",
      children: [{ label: "NP" }, { label: "VP" }],
    },
  ],
  meaning: {
    literal_cn: "那只敏捷的棕色狐狸跳过了那只懒狗。",
    natural_cn: "敏捷的棕狐跃过懒狗。",
  },
  key_points: [
    { point: "使用一般现在时" },
    { point: "包含英语字母表全部26个字母" },
  ],
  chunks: [
    {
      expression: "jump over",
      meaning: "跳过某物",
      examples: ["The cat jumped over the fence."],
    },
  ],
  review_summary: {
    look_first: "主语是 'the quick brown fox'",
    easy_to_misread: "动词短语的分隔容易造成误读",
    how_to_parse_next_time: "先找到主要动词",
  },
  practice: {
    scenario: "你正在向朋友描述一只有趣的动物。",
    tasks: [
      {
        cn: "请用英文描述这只狐狸的动作。",
        hint: "请用 jump over",
        reference: "The fox jumps over the dog.",
      },
      {
        cn: "请说明这只狐狸的外观特征。",
        hint: "请用形容词修饰名词",
        reference: "The quick brown fox is very agile.",
      },
    ],
  },
};

beforeEach(() => {
  db.exec("DELETE FROM sentences");
});

describe("getAnalysisById", () => {
  it("returns null for unknown id", () => {
    const result = getAnalysisById(9999);
    expect(result).toBeNull();
  });

  it("returns analysis with id and sentence after save", () => {
    saveSentence(MOCK_ANALYSIS.sentence, MOCK_ANALYSIS);
    const row = db
      .prepare("SELECT id FROM sentences WHERE text = ?")
      .get(MOCK_ANALYSIS.sentence) as { id: number };

    const result = getAnalysisById(row.id);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(row.id);
    expect(result!.sentence).toBe(MOCK_ANALYSIS.sentence);
    expect(result!.core_skeleton).toBe(MOCK_ANALYSIS.core_skeleton);
  });
});

describe("checkSentence", () => {
  it("returns null for nonexistent sentence", () => {
    const result = checkSentence("nonexistent sentence xyz");
    expect(result).toBeNull();
  });

  it("returns AnalysisResult after saveSentence", () => {
    saveSentence(MOCK_ANALYSIS.sentence, MOCK_ANALYSIS);
    const result = checkSentence(MOCK_ANALYSIS.sentence);
    expect(result).not.toBeNull();
    expect(result!.core_skeleton).toBe(MOCK_ANALYSIS.core_skeleton);
    expect(result!.sentence_type.category).toBe(
      MOCK_ANALYSIS.sentence_type.category
    );
  });
});

describe("saveSentence", () => {
  it("inserts a row retrievable by checkSentence", () => {
    saveSentence(MOCK_ANALYSIS.sentence, MOCK_ANALYSIS);
    const result = checkSentence(MOCK_ANALYSIS.sentence);
    expect(result).not.toBeNull();
  });
});
