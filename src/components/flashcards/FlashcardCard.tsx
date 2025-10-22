import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import type { FlashcardDto } from "../../types";

interface FlashcardCardProps {
  flashcard: FlashcardDto;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
}

export function FlashcardCard({ flashcard, onEdit, onDelete }: FlashcardCardProps) {
  // Truncate text for preview
  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Badge color based on source
  const getBadgeColor = (source: string) => {
    switch (source) {
      case "ai-full":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "ai-edited":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "manual":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getBadgeLabel = (source: string) => {
    switch (source) {
      case "ai-full":
        return "AI";
      case "ai-edited":
        return "AI (edytowane)";
      case "manual":
        return "Ręczne";
      default:
        return source;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        {/* Header with badge */}
        <div className="mb-4 flex items-start justify-between">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeColor(flashcard.source)}`}
          >
            {getBadgeLabel(flashcard.source)}
          </span>
          <span className="text-xs text-muted-foreground">{formatDate(flashcard.created_at)}</span>
        </div>

        {/* Flashcard content */}
        <div className="mb-4 space-y-3">
          {/* Front */}
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Przód</p>
            <p className="mt-1 text-sm font-medium">{truncate(flashcard.front, 100)}</p>
          </div>

          {/* Back */}
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Tył</p>
            <p className="mt-1 text-sm text-muted-foreground">{truncate(flashcard.back, 150)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(flashcard)}
            className="flex-1"
            aria-label={`Edytuj fiszkę: ${flashcard.front}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edytuj
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(flashcard)}
            className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            aria-label={`Usuń fiszkę: ${flashcard.front}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Usuń
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

