import type { AnalysisResult } from "./analysis.js";

// Request types
export interface CheckSentenceRequest {
  sentence: string;
}

export interface SaveSentenceRequest {
  sentence: string;
  analysis: AnalysisResult;
}

export interface SaveToLibraryRequest {
  sentence: string;
}

export interface SaveChunkRequest {
  expression: string;
  meaning: string;
  examples: string[];
}

// Response types
export type AnalysisResponse = AnalysisResult & { id: number };

export interface SaveSentenceResponse {
  success: boolean;
  id: number;
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface HistoryEntry {
  id: number;
  text: string;
  created_at: string;
}

export interface FeedbackRequest {
  userTranslation: string;
  reference: string;
  hint: string;
  cn: string;
}

export interface FeedbackResponse {
  commentary: string;
}
