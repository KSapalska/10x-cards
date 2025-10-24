import { useState, useEffect } from "react";
import type { FlashcardsListResponseDto, Source } from "../../types";

interface FlashcardsQueryParams {
  page: number;
  limit: number;
  sort?: "created_at" | "updated_at" | "front" | "source";
  order?: "asc" | "desc";
  source?: Source;
  generation_id?: number;
}

/**
 * Custom hook for managing flashcards list with pagination, filtering and sorting
 */
export function useFlashcards(params: FlashcardsQueryParams) {
  const [data, setData] = useState<FlashcardsListResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlashcards = async () => {
    setIsLoading(true);
    setError(null);

    // Build query params object - only include defined values
    const queryParamsObj: Record<string, string> = {
      page: params.page.toString(),
      limit: params.limit.toString(),
    };

    if (params.sort) {
      queryParamsObj.sort = params.sort;
    }

    if (params.order) {
      queryParamsObj.order = params.order;
    }

    if (params.source) {
      queryParamsObj.source = params.source;
    }

    if (params.generation_id !== undefined) {
      queryParamsObj.generation_id = params.generation_id.toString();
    }

    const queryString = new URLSearchParams(queryParamsObj).toString();

    try {
      const response = await fetch(`/api/flashcards?${queryString}`);

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          window.location.href = "/auth/login?returnTo=/flashcards";
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch flashcards");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [params.page, params.limit, params.sort, params.order, params.source, params.generation_id]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchFlashcards,
  };
}
