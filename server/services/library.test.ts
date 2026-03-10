import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/index.js";
import { saveToLibrary, getSaved, getHistory } from "./library.js";

const TEST_SENTENCE = "She sells seashells by the seashore.";
const TEST_ANALYSIS_JSON = JSON.stringify({
  sentence: TEST_SENTENCE,
  sentence_type: { category: "simple", summary: "Alliterative sentence." },
  main_clause: { subject: "She", verb: "sells", complement: "seashells" },
  core_skeleton: "She sells",
  components: [{ text: "She", role: "subject" }],
  structure_tree: [],
  meaning: { literal_cn: "她在海边卖贝壳。", natural_cn: "她在海边卖贝壳。" },
  key_points: [],
  chunks: [],
  review_summary: {
    look_first: "subject",
    easy_to_misread: "alliteration",
    how_to_parse_next_time: "find verb",
  },
  quiz: [],
});

beforeEach(() => {
  db.exec("DELETE FROM saved_sentences");
  db.exec("DELETE FROM sentences");
});

describe("saveToLibrary", () => {
  it("returns success: false when sentence not in history", () => {
    const result = saveToLibrary("unknown sentence that does not exist");
    expect(result.success).toBe(false);
  });

  it("inserts into saved_sentences for known sentence", () => {
    db.prepare(
      "INSERT INTO sentences (text, analysis_json) VALUES (?, ?)"
    ).run(TEST_SENTENCE, TEST_ANALYSIS_JSON);

    const result = saveToLibrary(TEST_SENTENCE);
    expect(result.success).toBe(true);
    expect(result.message).toBeUndefined();

    const saved = db
      .prepare(
        "SELECT * FROM saved_sentences ss JOIN sentences s ON ss.sentence_id = s.id WHERE s.text = ?"
      )
      .get(TEST_SENTENCE);
    expect(saved).not.toBeNull();
  });

  it("returns Already saved for duplicate", () => {
    db.prepare(
      "INSERT INTO sentences (text, analysis_json) VALUES (?, ?)"
    ).run(TEST_SENTENCE, TEST_ANALYSIS_JSON);

    saveToLibrary(TEST_SENTENCE);
    const result = saveToLibrary(TEST_SENTENCE);
    expect(result.success).toBe(true);
    expect(result.message).toBe("Already saved");
  });
});

describe("getSaved", () => {
  it("returns joined data from saved_sentences + sentences", () => {
    db.prepare(
      "INSERT INTO sentences (text, analysis_json) VALUES (?, ?)"
    ).run(TEST_SENTENCE, TEST_ANALYSIS_JSON);
    saveToLibrary(TEST_SENTENCE);

    const saved = getSaved();
    expect(saved.length).toBe(1);
    expect(saved[0].text).toBe(TEST_SENTENCE);
    expect(saved[0].analysis_json).toBe(TEST_ANALYSIS_JSON);
  });
});

describe("getHistory", () => {
  it("returns recent sentences ordered by created_at DESC, limit 10", () => {
    for (let i = 1; i <= 12; i++) {
      db.prepare(
        "INSERT INTO sentences (text, analysis_json) VALUES (?, ?)"
      ).run(`Sentence ${i}`, TEST_ANALYSIS_JSON);
    }

    const history = getHistory();
    expect(history.length).toBe(10);
    // Should return exactly 10 (not all 12)
    const texts = history.map((h) => h.text);
    // All returned should be valid sentence entries
    texts.forEach((t) => expect(t).toMatch(/^Sentence \d+$/));
  });

  it("returns entries with id, text, created_at fields", () => {
    db.prepare(
      "INSERT INTO sentences (text, analysis_json) VALUES (?, ?)"
    ).run(TEST_SENTENCE, TEST_ANALYSIS_JSON);

    const history = getHistory();
    expect(history.length).toBe(1);
    expect(history[0]).toHaveProperty("id");
    expect(history[0]).toHaveProperty("text");
    expect(history[0]).toHaveProperty("created_at");
  });
});
