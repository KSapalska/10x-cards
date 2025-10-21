import { useState, useId } from "react";
import type { FlashcardProposalViewModel } from "./FlashcardGenerationView";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { validateFlashcard, FLASHCARD_LIMITS } from "@/lib/validation";

interface FlashcardListItemProps {
  flashcard: FlashcardProposalViewModel;
  onAccept: (id: string) => void;
  onEdit: (id: string, front: string, back: string) => void;
  onReject: (id: string) => void;
}

export function FlashcardListItem({ flashcard, onAccept, onEdit, onReject }: FlashcardListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(flashcard.front);
  const [editedBack, setEditedBack] = useState(flashcard.back);
  const [validationError, setValidationError] = useState<string | null>(null);

  const frontId = useId();
  const backId = useId();

  const handleEdit = () => {
    setIsEditing(true);
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
    setValidationError(null);
  };

  const handleSaveEdit = () => {
    // Use extracted validation function
    const error = validateFlashcard(editedFront, editedBack);
    if (error) {
      setValidationError(error);
      return;
    }

    onEdit(flashcard.id, editedFront.trim(), editedBack.trim());
    setIsEditing(false);
    setValidationError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
    setValidationError(null);
  };

  const handleAccept = () => {
    onAccept(flashcard.id);
  };

  const handleReject = () => {
    onReject(flashcard.id);
  };

  return (
    <Card
      className={cn(
        "transition-all h-full flex flex-col",
        flashcard.accepted && "border-green-500 bg-green-50 dark:bg-green-950/20",
        flashcard.edited && "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
      )}
      data-testid="flashcard-item"
    >
      <CardContent className="flex flex-col h-full p-4">
        {isEditing ? (
          <>
            {/* Edit Mode */}
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-2">
                <label htmlFor={frontId} className="block text-sm font-medium text-foreground">
                  Przód fiszki
                </label>
                <input
                  id={frontId}
                  type="text"
                  value={editedFront}
                  onChange={(e) => setEditedFront(e.target.value)}
                  className={cn(
                    "w-full rounded-md border bg-background px-3 py-2 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    editedFront.length > FLASHCARD_LIMITS.FRONT_MAX_LENGTH && "border-destructive"
                  )}
                  maxLength={FLASHCARD_LIMITS.FRONT_MAX_LENGTH}
                  aria-invalid={editedFront.length > FLASHCARD_LIMITS.FRONT_MAX_LENGTH}
                />
                <p className="text-xs text-muted-foreground">
                  {editedFront.length} / {FLASHCARD_LIMITS.FRONT_MAX_LENGTH} znaków
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor={backId} className="block text-sm font-medium text-foreground">
                  Tył fiszki
                </label>
                <textarea
                  id={backId}
                  value={editedBack}
                  onChange={(e) => setEditedBack(e.target.value)}
                  rows={4}
                  className={cn(
                    "w-full rounded-md border bg-background px-3 py-2 text-sm resize-y",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    editedBack.length > FLASHCARD_LIMITS.BACK_MAX_LENGTH && "border-destructive"
                  )}
                  maxLength={FLASHCARD_LIMITS.BACK_MAX_LENGTH}
                  aria-invalid={editedBack.length > FLASHCARD_LIMITS.BACK_MAX_LENGTH}
                />
                <p className="text-xs text-muted-foreground">
                  {editedBack.length} / {FLASHCARD_LIMITS.BACK_MAX_LENGTH} znaków
                </p>
              </div>

              {validationError && (
                <div
                  className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20"
                  role="alert"
                >
                  {validationError}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} size="sm">
                  Zapisz zmiany
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm">
                  Anuluj
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* View Mode */}
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Pytanie</p>
                <p className="text-base font-medium line-clamp-3">{flashcard.front}</p>
              </div>

              <div className="space-y-1 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Odpowiedź</p>
                <p className="text-sm text-muted-foreground line-clamp-4">{flashcard.back}</p>
              </div>

              {flashcard.edited && (
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <span>Edytowana</span>
                </div>
              )}

              {flashcard.accepted && (
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Zaakceptowana</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap mt-auto pt-4">
              <Button
                onClick={handleAccept}
                variant={flashcard.accepted ? "default" : "outline"}
                size="sm"
                aria-label={flashcard.accepted ? "Fiszka zaakceptowana" : "Zaakceptuj fiszkę"}
                data-testid="flashcard-accept-button"
              >
                {flashcard.accepted ? "Zaakceptowano" : "Zatwierdź"}
              </Button>
              <Button
                onClick={handleEdit}
                variant="outline"
                size="sm"
                aria-label="Edytuj fiszkę"
                data-testid="flashcard-edit-button"
              >
                Edytuj
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                size="sm"
                aria-label="Odrzuć i usuń fiszkę"
                data-testid="flashcard-reject-button"
              >
                Odrzuć
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
