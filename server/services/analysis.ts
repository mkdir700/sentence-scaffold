import { db } from "../../src/db/index.js";
import type { SentenceRow, AnalysisResult } from "../../src/types/index.js";

/**
 * Check if a sentence has been previously analyzed.
 * Returns the cached AnalysisResult or null if not found.
 */
export function checkSentence(sentence: string): AnalysisResult | null {
  const row = db
    .prepare("SELECT * FROM sentences WHERE text = ?")
    .get(sentence) as SentenceRow | undefined;

  if (!row) return null;
  return JSON.parse(row.analysis_json) as AnalysisResult;
}

/**
 * Save a sentence and its analysis to the database.
 */
export function saveSentence(
  sentence: string,
  analysis: AnalysisResult
): void {
  db.prepare("INSERT INTO sentences (text, analysis_json) VALUES (?, ?)").run(
    sentence,
    JSON.stringify(analysis)
  );
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
