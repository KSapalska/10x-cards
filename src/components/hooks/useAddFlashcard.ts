import { useState } from "react";
import type { FlashcardDto } from "../../types";

/**
 * Custom hook for adding a new flashcard
 */
export function useAddFlashcard() {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFlashcard = async (front: string, back: string): Promise<FlashcardDto | null> => {
    setIsAdding(true);
    setError(null);

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcards: [
            {
              front,
              back,
              source: "manual",
              generation_id: null,
            },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth/login?returnTo=/flashcards";
          return null;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.flashcards[0] as FlashcardDto;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać fiszki");
      return null;
    } finally {
      setIsAdding(false);
    }
  };

  return {
    addFlashcard,
    isAdding,
    error,
  };
}
