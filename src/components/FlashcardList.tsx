import type { FlashcardProposalViewModel } from "./FlashcardGenerationView";
import { FlashcardListItem } from "./FlashcardListItem";

interface FlashcardListProps {
  flashcards: FlashcardProposalViewModel[];
  onAccept: (id: string) => void;
  onEdit: (id: string, front: string, back: string) => void;
  onReject: (id: string) => void;
}

export function FlashcardList({ flashcards, onAccept, onEdit, onReject }: FlashcardListProps) {
  if (flashcards.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr"
      role="list"
      aria-label="Lista propozycji fiszek"
      data-testid="flashcard-list"
    >
      {flashcards.map((flashcard) => (
        <div key={flashcard.id} role="listitem" className="h-full">
          <FlashcardListItem flashcard={flashcard} onAccept={onAccept} onEdit={onEdit} onReject={onReject} />
        </div>
      ))}
    </div>
  );
}
