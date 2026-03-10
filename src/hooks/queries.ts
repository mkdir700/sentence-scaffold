import { queryOptions } from "@tanstack/react-query";
import { api } from "@/src/lib/api";

export const queryKeys = {
  history: {
    all: () => ["history"] as const,
  },
  library: {
    all: () => ["library"] as const,
    saved: () => ["library", "saved"] as const,
    chunks: () => ["library", "chunks"] as const,
  },
  analysis: {
    all: () => ["analysis"] as const,
    byId: (id: number) => ["analysis", id] as const,
  },
};

export function analysisQueryOptions(id: number) {
  return queryOptions({
    queryKey: queryKeys.analysis.byId(id),
    queryFn: () => api.getAnalysisById(id),
    staleTime: Infinity,
  });
}

export function historyQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.history.all(),
    queryFn: () => api.getHistory(),
  });
}

export function savedSentencesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.library.saved(),
    queryFn: () => api.getSaved(),
  });
}

export function chunksQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.library.chunks(),
    queryFn: () => api.getChunks(),
  });
}
