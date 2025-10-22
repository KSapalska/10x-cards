import { FlashcardCard } from "./FlashcardCard";
import { EmptyState } from "./EmptyState";
import { SkeletonLoader } from "../SkeletonLoader";
import type { FlashcardDto } from "../../types";

interface FlashcardsGridProps {
  flashcards: FlashcardDto[];
  isLoading: boolean;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
  onAddClick: () => void;
  onGenerateClick: () => void;
}

export function FlashcardsGrid({
  flashcards,
  isLoading,
  onEdit,
  onDelete,
  onAddClick,
  onGenerateClick,
}: FlashcardsGridProps) {
  if (isLoading) {
    return <SkeletonLoader count={6} />;
  }

  if (flashcards.length === 0) {
    return <EmptyState onAddClick={onAddClick} onGenerateClick={onGenerateClick} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {flashcards.map((flashcard) => (
        <FlashcardCard key={flashcard.id} flashcard={flashcard} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

