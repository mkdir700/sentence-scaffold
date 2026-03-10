import { db } from "../../src/db/index.js";
import type { HistoryEntry } from "../../src/types/index.js";

/**
 * Save a sentence to the library (saved_sentences table).
 * Finds the sentence by text, checks for duplicates, then inserts if needed.
 */
export function saveToLibrary(
  sentence: string
): { success: boolean; message?: string } {
  const existing = db
    .prepare("SELECT id FROM sentences WHERE text = ?")
    .get(sentence) as { id: number } | undefined;

  if (!existing) {
    return { success: false, message: "Sentence not found in history" };
  }

  const alreadySaved = db
    .prepare("SELECT id FROM saved_sentences WHERE sentence_id = ?")
    .get(existing.id);

  if (alreadySaved) {
    return { success: true, message: "Already saved" };
  }

  db.prepare("INSERT INTO saved_sentences (sentence_id) VALUES (?)").run(
    existing.id
  );
  return { success: true };
}

/**
 * Get all saved sentences joined with their analysis data.
 */
export function getSaved(): Array<{
  id: number;
  text: string;
  analysis_json: string;
  created_at: string;
}> {
  return db
    .prepare(
      `
      SELECT s.id, s.text, s.analysis_json, ss.created_at
      FROM saved_sentences ss
      JOIN sentences s ON ss.sentence_id = s.id
      ORDER BY ss.created_at DESC
    `
    )
    .all() as Array<{
    id: number;
    text: string;
    analysis_json: string;
    created_at: string;
  }>;
}

/**
 * Get recent sentence history, limit 10, ordered by created_at DESC.
 */
export function getHistory(): HistoryEntry[] {
  return db
    .prepare(
      "SELECT id, text, created_at FROM sentences ORDER BY created_at DESC LIMIT 10"
    )
    .all() as HistoryEntry[];
}
