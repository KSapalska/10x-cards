import { Button } from "../ui/button";
import type { FlashcardDto } from "../../types";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  flashcard,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  if (!isOpen || !flashcard) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !isDeleting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <div className="relative w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 id="delete-dialog-title" className="text-lg font-semibold">
              Usuń fiszkę
            </h2>
          </div>
        </div>

        {/* Content */}
        <div id="delete-dialog-description" className="mb-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Czy na pewno chcesz usunąć tę fiszkę? Ta akcja jest nieodwracalna.
          </p>

          {/* Preview of the flashcard */}
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">Przód fiszki</p>
            <p className="mt-1 text-sm font-medium">{flashcard.front}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
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
                Usuwanie...
              </>
            ) : (
              "Usuń"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

