// src/hooks/useQuizQuery.ts — tidak berubah dari Tugas 7, kecuali `initialData`
// yang dulu di-pre-fetch di Server Component kini di-pre-fetch lewat
// queryClient.prefetchQuery di KuisAdaptifPage.tsx sebelum render (lihat
// README.md § Migrasi untuk detail penggantian pola RSC pre-fetch).

import { fetchQuestionsByLevel } from "@/lib/api/quizApi";
import type { Question } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export const quizQuestionsQueryKey = (level: number, chapter?: string) =>
  ["quiz", level, chapter ?? "all"] as const;

export function useQuizQuestionsQuery(
  level: number,
  chapter?: string,
  initialData?: Question[]
) {
  return useQuery({
    queryKey: quizQuestionsQueryKey(level, chapter),
    queryFn: () => fetchQuestionsByLevel(level, chapter),
    initialData,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    enabled: level >= 1 && level <= 3,
    retry: 1,
  });
}
