import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface EmptyStateProps {
  onAddClick: () => void;
  onGenerateClick: () => void;
}

export function EmptyState({ onAddClick, onGenerateClick }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        {/* Icon */}
        <div className="mb-4 rounded-full bg-muted p-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>

        {/* Heading */}
        <h3 className="mb-2 text-xl font-semibold">Nie masz jeszcze żadnych fiszek</h3>

        {/* Description */}
        <p className="mb-6 max-w-sm text-muted-foreground">
          Dodaj pierwszą fiszkę ręcznie lub wygeneruj je automatycznie z tekstu przy użyciu AI
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onAddClick} variant="default">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Dodaj fiszkę
          </Button>
          <Button onClick={onGenerateClick} variant="outline">
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Generuj z tekstu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

