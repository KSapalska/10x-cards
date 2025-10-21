import { useState } from "react";
import type { FlashcardProposalViewModel } from "./FlashcardGenerationView";
import type { FlashcardsCreateCommand } from "../types";
import { Button } from "./ui/button";

interface BulkSaveButtonProps {
  flashcards: FlashcardProposalViewModel[];
  generationId: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function BulkSaveButton({ flashcards, generationId, onSuccess, onError }: BulkSaveButtonProps) {
  const [isSaving, setIsSaving] = useState(false);

  const acceptedFlashcards = flashcards.filter((f) => f.accepted);
  const hasFlashcards = flashcards.length > 0;
  const hasAccepted = acceptedFlashcards.length > 0;

  const handleSave = async (saveAll: boolean) => {
    const flashcardsToSave = saveAll ? flashcards : acceptedFlashcards;

    if (flashcardsToSave.length === 0) {
      onError?.(saveAll ? "Brak fiszek do zapisania" : "Brak zaakceptowanych fiszek do zapisania");
      return;
    }

    setIsSaving(true);

    try {
      const command: FlashcardsCreateCommand = {
        flashcards: flashcardsToSave.map((f) => ({
          front: f.front,
          back: f.back,
          source: f.source,
          generation_id: generationId,
        })),
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd podczas zapisywania fiszek");
      }

      const result = await response.json();
      console.log("Zapisano fiszki:", result);
      onSuccess?.();
    } catch (error) {
      console.error("Błąd podczas zapisywania fiszek:", error);
      onError?.(error instanceof Error ? error.message : "Nieznany błąd podczas zapisywania");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = () => handleSave(true);
  const handleSaveAccepted = () => handleSave(false);

  if (!hasFlashcards) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg border bg-card" data-testid="bulk-save-section">
      <div className="flex-1">
        <h4 className="text-sm font-semibold mb-1">Gotowe do zapisu?</h4>
        <p className="text-sm text-muted-foreground">
          Zapisz wszystkie fiszki ({flashcards.length}) lub tylko zaakceptowane ({acceptedFlashcards.length})
        </p>
      </div>
      <div className="flex gap-2 sm:items-center">
        <Button
          onClick={handleSaveAccepted}
          disabled={!hasAccepted || isSaving}
          variant="default"
          aria-label={`Zapisz ${acceptedFlashcards.length} zaakceptowanych fiszek`}
          data-testid="save-accepted-button"
        >
          {isSaving ? "Zapisywanie..." : `Zapisz zaakceptowane (${acceptedFlashcards.length})`}
        </Button>
        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          variant="outline"
          aria-label={`Zapisz wszystkie ${flashcards.length} fiszek`}
          data-testid="save-all-button"
        >
          {isSaving ? "Zapisywanie..." : `Zapisz wszystkie (${flashcards.length})`}
        </Button>
      </div>
    </div>
  );
}
