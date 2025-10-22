import { useState } from "react";

/**
 * Custom hook for deleting a flashcard
 */
export function useDeleteFlashcard() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteFlashcard = async (id: number): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth/login?returnTo=/flashcards";
          return false;
        }

        if (response.status === 404) {
          throw new Error("Fiszka nie została znaleziona");
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć fiszki");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteFlashcard,
    isDeleting,
    error,
  };
}

