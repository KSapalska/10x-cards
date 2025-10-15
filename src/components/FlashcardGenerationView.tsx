import { useState, useEffect } from "react";
import { TextInputArea } from "./TextInputArea";
import { GenerateButton } from "./GenerateButton";
import { SkeletonLoader } from "./SkeletonLoader";
import { FlashcardList } from "./FlashcardList";
import { ErrorNotification } from "./ErrorNotification";
import { BulkSaveButton } from "./BulkSaveButton";
import { useGenerateFlashcards } from "./hooks/useGenerateFlashcards";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";

// Extended ViewModel for flashcard proposals with UI state
export interface FlashcardProposalViewModel {
  front: string;
  back: string;
  source: "ai-full" | "ai-edited";
  accepted: boolean;
  edited: boolean;
  id: string; // Unique identifier for React keys
}

export default function FlashcardGenerationView() {
  const [sourceText, setSourceText] = useState("");
  const [localFlashcards, setLocalFlashcards] = useState<FlashcardProposalViewModel[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { isLoading, errorMessage, generationId, flashcards, generateFlashcards, resetError } = useGenerateFlashcards();

  // Sync flashcards from hook to local state
  useEffect(() => {
    if (flashcards.length > 0) {
      setLocalFlashcards(flashcards);
    }
  }, [flashcards]);

  // Validation: text must be between 1000 and 10000 characters
  const isTextValid = sourceText.length >= 1000 && sourceText.length <= 10000;
  const textLength = sourceText.length;

  const handleGenerateFlashcards = () => {
    generateFlashcards(sourceText);
  };

  const handleAccept = (id: string) => {
    setLocalFlashcards((prev) => prev.map((f) => (f.id === id ? { ...f, accepted: !f.accepted } : f)));
  };

  const handleEdit = (id: string, front: string, back: string) => {
    setLocalFlashcards((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              front,
              back,
              edited: true,
              source: "ai-edited" as const,
            }
          : f
      )
    );
  };

  const handleReject = (id: string) => {
    setLocalFlashcards((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSaveSuccess = () => {
    setSaveSuccess(true);
    setSaveError(null);
    // Reset after showing success message
    setTimeout(() => {
      setSourceText("");
      setLocalFlashcards([]);
      setSaveSuccess(false);
    }, 3000);
  };

  const handleSaveError = (error: string) => {
    setSaveError(error);
    setSaveSuccess(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Wygeneruj fiszki z tekstu</CardTitle>
          <CardDescription>
            Wklej tekst (1000-10000 znaków), a AI wygeneruje dla Ciebie propozycje fiszek do nauki
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TextInputArea
            value={sourceText}
            onChange={setSourceText}
            textLength={textLength}
            isValid={isTextValid}
            disabled={isLoading}
          />

          {errorMessage && <ErrorNotification message={errorMessage} onDismiss={resetError} />}

          {saveError && <ErrorNotification message={saveError} onDismiss={() => setSaveError(null)} />}

          {saveSuccess && (
            <div
              className="p-4 rounded-md bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
                <p className="text-sm font-medium">Fiszki zostały pomyślnie zapisane!</p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end">
            <GenerateButton
              onClick={handleGenerateFlashcards}
              disabled={!isTextValid || isLoading}
              isLoading={isLoading}
            />
          </div>

          {/* Skeleton loader during generation */}
          {isLoading && <SkeletonLoader count={3} />}

          {localFlashcards.length > 0 && !isLoading && generationId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Wygenerowane propozycje ({localFlashcards.length})</h3>
                <p className="text-sm text-muted-foreground">
                  Zaakceptowano: {localFlashcards.filter((f) => f.accepted).length}
                </p>
              </div>
              <FlashcardList
                flashcards={localFlashcards}
                onAccept={handleAccept}
                onEdit={handleEdit}
                onReject={handleReject}
              />
              <BulkSaveButton
                flashcards={localFlashcards}
                generationId={generationId}
                onSuccess={handleSaveSuccess}
                onError={handleSaveError}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
