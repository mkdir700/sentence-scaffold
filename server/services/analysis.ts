import { db } from "../../src/db/index.js";
import type { SentenceRow, AnalysisResult } from "../../src/types/index.js";

/**
 * Check if a sentence has been previously analyzed.
 * Returns the cached AnalysisResult with id or null if not found.
 */
export function checkSentence(
  sentence: string
): (AnalysisResult & { id: number }) | null {
  const row = db
    .prepare("SELECT * FROM sentences WHERE text = ?")
    .get(sentence) as SentenceRow | undefined;

  if (!row) return null;
  const analysis = JSON.parse(row.analysis_json) as AnalysisResult;
  return { ...analysis, id: row.id };
}

/**
 * Save a sentence and its analysis to the database.
 * Returns the id of the newly inserted row.
 */
export function saveSentence(
  sentence: string,
  analysis: AnalysisResult
): { id: number } {
  const result = db
    .prepare("INSERT INTO sentences (text, analysis_json) VALUES (?, ?)")
    .run(sentence, JSON.stringify(analysis));
  return { id: Number(result.lastInsertRowid) };
}

/**
 * Retrieve an analysis by its primary key ID.
 * Returns parsed AnalysisResult with id and sentence text, or null if not found.
 * This implements the BEND-03 GET /api/analysis/:id logic.
 */
export function getAnalysisById(
  id: number
): (AnalysisResult & { id: number; sentence: string }) | null {
  const row = db
    .prepare("SELECT * FROM sentences WHERE id = ?")
    .get(id) as SentenceRow | undefined;

  if (!row) return null;

  const analysis = JSON.parse(row.analysis_json) as AnalysisResult;
  return { ...analysis, id: row.id, sentence: row.text };
}
