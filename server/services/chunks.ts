import { db } from "../../src/db/index.js";
import type { ChunkRow } from "../../src/types/index.js";

/**
 * Save a chunk expression to the database.
 * examples array is JSON-stringified for storage.
 */
export function saveChunk(
  expression: string,
  meaning: string,
  examples: string[]
): void {
  db.prepare(
    "INSERT INTO chunks (expression, meaning, examples) VALUES (?, ?, ?)"
  ).run(expression, meaning, JSON.stringify(examples));
}

/**
 * Get all chunks ordered by created_at DESC.
 */
export function getChunks(): ChunkRow[] {
  return db
    .prepare("SELECT * FROM chunks ORDER BY created_at DESC")
    .all() as ChunkRow[];
}
