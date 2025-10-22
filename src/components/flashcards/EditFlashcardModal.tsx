import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { validateFlashcard, FLASHCARD_LIMITS } from "../../lib/validation";
import type { FlashcardDto } from "../../types";

interface EditFlashcardModalProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onClose: () => void;
  onSuccess: (flashcard: FlashcardDto) => void;
  onEdit: (id: number, front: string, back: string) => Promise<FlashcardDto | null>;
  isEditing: boolean;
}

export function EditFlashcardModal({
  isOpen,
  flashcard,
  onClose,
  onSuccess,
  onEdit,
  isEditing,
}: EditFlashcardModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Populate form when flashcard changes
  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setValidationError(null);
    }
  }, [flashcard]);

  if (!isOpen || !flashcard) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const error = validateFlashcard(front, back);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);

    // Call the edit function from hook
    const updatedFlashcard = await onEdit(flashcard.id, front, back);

    if (updatedFlashcard) {
      onSuccess(updatedFlashcard);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isEditing) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !isEditing) {
      onClose();
    }
  };

  // Info message if editing ai-full flashcard
  const isAiFull = flashcard.source === "ai-full";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-dialog-title"
    >
      <div className="relative w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6">
          <h2 id="edit-dialog-title" className="text-lg font-semibold">
            Edytuj fiszkę
          </h2>
          {isAiFull && (
            <p className="mt-1 text-xs text-muted-foreground">
              💡 Po edycji fiszka zostanie oznaczona jako "AI (edytowane)"
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Front */}
          <div className="space-y-2">
            <Label htmlFor="edit-front">
              Przód fiszki <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="edit-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Wpisz pytanie lub pojęcie..."
              disabled={isEditing}
              maxLength={FLASHCARD_LIMITS.FRONT_MAX_LENGTH}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Maksymalnie {FLASHCARD_LIMITS.FRONT_MAX_LENGTH} znaków</span>
              <span
                className={
                  front.length > FLASHCARD_LIMITS.FRONT_MAX_LENGTH * 0.9 ? "text-orange-600 dark:text-orange-400" : ""
                }
              >
                {front.length}/{FLASHCARD_LIMITS.FRONT_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Back */}
          <div className="space-y-2">
            <Label htmlFor="edit-back">
              Tył fiszki <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="edit-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Wpisz odpowiedź lub definicję..."
              disabled={isEditing}
              maxLength={FLASHCARD_LIMITS.BACK_MAX_LENGTH}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Maksymalnie {FLASHCARD_LIMITS.BACK_MAX_LENGTH} znaków</span>
              <span
                className={
                  back.length > FLASHCARD_LIMITS.BACK_MAX_LENGTH * 0.9 ? "text-orange-600 dark:text-orange-400" : ""
                }
              >
                {back.length}/{FLASHCARD_LIMITS.BACK_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {validationError}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isEditing}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isEditing}>
              {isEditing ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Zapisywanie...
                </>
              ) : (
                "Zapisz zmiany"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

