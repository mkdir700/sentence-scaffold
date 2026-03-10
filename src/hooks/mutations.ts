import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { queryKeys } from "@/src/hooks/queries";

export function useFeedback() {
  return useMutation({
    mutationFn: (params: {
      userTranslation: string;
      reference: string;
      hint: string;
      cn: string;
    }) => api.getFeedback(params),
  });
}

export function useSaveSentenceToLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sentence: string) => api.saveSentenceToLibrary(sentence),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.library.all(),
      });
    },
  });
}

export function useSaveChunk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chunk: Parameters<typeof api.saveChunk>[0]) =>
      api.saveChunk(chunk),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.library.chunks(),
      });
    },
  });
}
