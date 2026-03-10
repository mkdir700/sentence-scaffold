export interface SentenceRow {
  id: number;
  text: string;
  analysis_json: string;
  created_at: string;
}

export interface SavedSentenceRow {
  id: number;
  sentence_id: number;
  tags: string | null;
  notes: string | null;
  review_status: string;
  created_at: string;
}

export interface ChunkRow {
  id: number;
  expression: string;
  meaning: string;
  pattern: string | null;
  examples: string | null; // JSON-serialized string[]
  source_sentence_id: number | null;
  tags: string | null;
  review_status: string;
  created_at: string;
}
