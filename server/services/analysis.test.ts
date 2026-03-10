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
    category: "simple",
    summary: "A simple declarative sentence.",
  },
  main_clause: {
    subject: "The quick brown fox",
    verb: "jumps",
    complement: "over the lazy dog",
  },
  core_skeleton: "fox jumps",
  components: [
    { text: "The quick brown fox", role: "subject" },
    { text: "jumps", role: "verb" },
    { text: "over the lazy dog", role: "adverbial" },
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
    { point: "Uses present simple tense" },
    { point: "Contains all 26 letters of the English alphabet" },
  ],
  chunks: [
    {
      expression: "jump over",
      meaning: "to leap across something",
      examples: ["The cat jumped over the fence."],
    },
  ],
  review_summary: {
    look_first: "The subject is 'the quick brown fox'",
    easy_to_misread: "The verb phrase separation",
    how_to_parse_next_time: "Find the main verb first",
  },
  quiz: [
    {
      question: "What is the subject of this sentence?",
      reference_answer: "The quick brown fox",
    },
  ],
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
