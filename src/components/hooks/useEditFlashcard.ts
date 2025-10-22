import { useState } from "react";
import type { FlashcardDto } from "../../types";

/**
 * Custom hook for editing a flashcard
 */
export function useEditFlashcard() {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editFlashcard = async (id: number, front: string, back: string): Promise<FlashcardDto | null> => {
    setIsEditing(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          front,
          back,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth/login?returnTo=/flashcards";
          return null;
        }

        if (response.status === 404) {
          throw new Error("Fiszka nie została znaleziona");
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const updatedFlashcard = await response.json();
      return updatedFlashcard as FlashcardDto;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zaktualizować fiszki");
      return null;
    } finally {
      setIsEditing(false);
    }
  };

  return {
    editFlashcard,
    isEditing,
    error,
  };
}

