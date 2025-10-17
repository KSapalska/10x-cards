import { useState, useCallback } from "react";
import type { GenerationCreateResponseDto } from "../../types";
import type { FlashcardProposalViewModel } from "../FlashcardGenerationView";

interface UseGenerateFlashcardsReturn {
  isLoading: boolean;
  errorMessage: string | null;
  generationId: number | null;
  flashcards: FlashcardProposalViewModel[];
  generateFlashcards: (sourceText: string) => Promise<void>;
  resetError: () => void;
}

export function useGenerateFlashcards(): UseGenerateFlashcardsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardProposalViewModel[]>([]);

  const generateFlashcards = useCallback(async (sourceText: string) => {
    // Validation
    if (sourceText.length < 1000 || sourceText.length > 10000) {
      setErrorMessage("Tekst musi zawierać od 1000 do 10000 znaków");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setFlashcards([]);
    setGenerationId(null);

    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source_text: sourceText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd podczas generowania fiszek");
      }

      const data: GenerationCreateResponseDto = await response.json();

      // Validate response data
      if (!data.flashcards_proposals || !Array.isArray(data.flashcards_proposals)) {
        throw new Error("Nieprawidłowa odpowiedź serwera");
      }

      // Convert proposals to view models with UI state
      const viewModels: FlashcardProposalViewModel[] = data.flashcards_proposals.map((proposal, index) => ({
        ...proposal,
        accepted: false,
        edited: false,
        id: `${data.generation_id}-${index}`,
      }));

      setGenerationId(data.generation_id);
      setFlashcards(viewModels);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nieznany błąd");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    isLoading,
    errorMessage,
    generationId,
    flashcards,
    generateFlashcards,
    resetError,
  };
}
