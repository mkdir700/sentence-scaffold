import type {
  AnalysisResult,
  HistoryEntry,
  SaveChunkRequest,
} from "@/src/types/index";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  checkSentence(sentence: string): Promise<AnalysisResult & { id: number }> {
    return apiFetch("/api/check-sentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence }),
    });
  },

  saveSentence(
    sentence: string,
    analysis: AnalysisResult
  ): Promise<{ success: boolean; id: number }> {
    return apiFetch("/api/save-sentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence, analysis }),
    });
  },

  getAnalysisById(
    id: number
  ): Promise<AnalysisResult & { id: number; sentence: string }> {
    return apiFetch(`/api/analysis/${id}`);
  },

  getHistory(): Promise<HistoryEntry[]> {
    return apiFetch("/api/history");
  },

  getSaved(): Promise<unknown[]> {
    return apiFetch("/api/library");
  },

  getChunks(): Promise<unknown[]> {
    return apiFetch("/api/chunks");
  },

  saveSentenceToLibrary(sentence: string): Promise<{ success: boolean }> {
    return apiFetch("/api/save-to-library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence }),
    });
  },

  saveChunk(chunk: SaveChunkRequest): Promise<{ success: boolean }> {
    return apiFetch("/api/save-chunk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chunk),
    });
  },
};
