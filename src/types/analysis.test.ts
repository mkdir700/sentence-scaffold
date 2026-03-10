import { describe, it, expect } from "vitest";
import { AnalysisResultSchema } from "./analysis.js";

const REAL_GEMINI_RESPONSE_SNAPSHOT = {
  sentence: "The quick brown fox jumps over the lazy dog.",
  sentence_type: {
    category: "simple",
    summary: "A simple declarative sentence with subject and intransitive verb.",
  },
  main_clause: {
    subject: "The quick brown fox",
    verb: "jumps",
    // complement intentionally omitted — tests optional field
  },
  core_skeleton: "Fox jumps over dog.",
  components: [
    { text: "The quick brown fox", role: "subject" },
    { text: "jumps", role: "main verb" },
    {
      text: "over the lazy dog",
      role: "prepositional phrase",
      modifies: "jumps",
    },
  ],
  structure_tree: [
    {
      label: "S",
      children: [{ label: "NP: The quick brown fox" }, { label: "VP: jumps over the lazy dog" }],
    },
  ],
  meaning: {
    literal_cn: "这只敏捷的棕色狐狸跳过了那只懒狗。",
    natural_cn: "敏捷的棕色狐狸跳过了懒狗。",
  },
  key_points: [
    { point: "Main verb is 'jumps' — an intransitive verb used with a prepositional phrase." },
    { point: "The adjectives 'quick' and 'brown' pre-modify the subject noun 'fox'." },
  ],
  chunks: [
    {
      expression: "jump over",
      meaning: "跳过，越过",
      examples: [
        "The athlete jumped over the hurdle.",
        "She jumped over the puddle to avoid getting wet.",
      ],
    },
  ],
  review_summary: {
    look_first: "Identify the main verb 'jumps' to anchor the sentence structure.",
    easy_to_misread: "Do not confuse 'lazy dog' as the subject — it is the object of the preposition 'over'.",
    how_to_parse_next_time: "Find subject (fox) → main verb (jumps) → prepositional phrase (over the lazy dog).",
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

describe("AnalysisResultSchema", () => {
  it("validates a complete Gemini response snapshot without error", () => {
    expect(() =>
      AnalysisResultSchema.parse(REAL_GEMINI_RESPONSE_SNAPSHOT)
    ).not.toThrow();
  });

  it("rejects a response missing required fields", () => {
    const { sentence: _removed, ...withoutSentence } =
      REAL_GEMINI_RESPONSE_SNAPSHOT;
    expect(() => AnalysisResultSchema.parse(withoutSentence)).toThrow();
  });

  it("accepts a response with optional fields omitted", () => {
    const snapshotWithoutOptionals = {
      ...REAL_GEMINI_RESPONSE_SNAPSHOT,
      main_clause: {
        subject: "The quick brown fox",
        verb: "jumps",
        // complement omitted
      },
      components: [
        { text: "The quick brown fox", role: "subject" },
        { text: "jumps", role: "main verb" },
        {
          text: "over the lazy dog",
          role: "prepositional phrase",
          // modifies omitted
          // explains omitted
        },
      ],
    };
    expect(() =>
      AnalysisResultSchema.parse(snapshotWithoutOptionals)
    ).not.toThrow();
  });
});
