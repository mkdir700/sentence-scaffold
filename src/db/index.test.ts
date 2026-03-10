import { describe, it, expect } from "vitest";
import { db } from "./index.js";
import type { SentenceRow } from "../types/index.js";

describe("DB smoke test", () => {
  it("inserts and retrieves a sentence row", () => {
    db.prepare(
      "INSERT INTO sentences (text, analysis_json) VALUES (?, ?)"
    ).run("Test sentence", JSON.stringify({ sentence: "Test sentence" }));

    const row = db
      .prepare("SELECT * FROM sentences WHERE text = ?")
      .get("Test sentence") as SentenceRow | undefined;

    expect(row).toBeDefined();
    expect(row?.text).toBe("Test sentence");
  });

  it("returns undefined for a non-existent row", () => {
    const row = db
      .prepare("SELECT * FROM sentences WHERE id = ?")
      .get(999999) as SentenceRow | undefined;

    expect(row).toBeUndefined();
  });
});
