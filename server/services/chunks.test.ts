import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/index.js";
import { saveChunk, getChunks } from "./chunks.js";

beforeEach(() => {
  db.exec("DELETE FROM chunks");
});

describe("getChunks", () => {
  it("returns empty array initially", () => {
    const chunks = getChunks();
    expect(chunks).toEqual([]);
  });
});

describe("saveChunk + getChunks", () => {
  it("inserts a chunk row retrievable by getChunks", () => {
    saveChunk("look forward to", "to anticipate with pleasure", [
      "I look forward to seeing you.",
      "She looks forward to the weekend.",
    ]);

    const chunks = getChunks();
    expect(chunks.length).toBe(1);
    expect(chunks[0].expression).toBe("look forward to");
    expect(chunks[0].meaning).toBe("to anticipate with pleasure");
  });

  it("serializes examples as JSON string in DB", () => {
    const examples = ["Example one.", "Example two."];
    saveChunk("phrase", "meaning", examples);

    const row = db.prepare("SELECT examples FROM chunks").get() as {
      examples: string;
    };
    expect(typeof row.examples).toBe("string");
    expect(JSON.parse(row.examples)).toEqual(examples);
  });

  it("returns all chunks when multiple are saved", () => {
    saveChunk("first chunk", "meaning 1", []);
    saveChunk("second chunk", "meaning 2", []);

    const chunks = getChunks();
    expect(chunks.length).toBe(2);
    const expressions = chunks.map((c) => c.expression);
    expect(expressions).toContain("first chunk");
    expect(expressions).toContain("second chunk");
  });
});
