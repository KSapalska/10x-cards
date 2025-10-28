import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { validateFlashcard, FLASHCARD_LIMITS } from "../../lib/validation";
import type { FlashcardDto } from "../../types";

interface AddFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (flashcard: FlashcardDto) => void;
  onAdd: (front: string, back: string) => Promise<FlashcardDto | null>;
  isAdding: boolean;
}

export function AddFlashcardModal({ isOpen, onClose, onSuccess, onAdd, isAdding }: AddFlashcardModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFront("");
      setBack("");
      setValidationError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
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

    // Call the add function from hook
    const newFlashcard = await onAdd(front, back);

    if (newFlashcard) {
      onSuccess(newFlashcard);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isAdding) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !isAdding) {
      onClose();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-dialog-title"
      tabIndex={-1}
    >
      <div className="relative w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6">
          <h2 id="add-dialog-title" className="text-lg font-semibold">
            Dodaj nową fiszkę
          </h2>
          <p className="text-sm text-muted-foreground">Wypełnij przód i tył fiszki</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Front */}
          <div className="space-y-2">
            <Label htmlFor="front">
              Przód fiszki <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Wpisz pytanie lub pojęcie..."
              disabled={isAdding}
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
            <Label htmlFor="back">
              Tył fiszki <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Wpisz odpowiedź lub definicję..."
              disabled={isAdding}
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isAdding}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding ? (
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
                  Dodawanie...
                </>
              ) : (
                "Dodaj fiszkę"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
