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
    <div className="space-y-4" role="list" aria-label="Lista propozycji fiszek">
      {flashcards.map((flashcard) => (
        <div key={flashcard.id} role="listitem">
          <FlashcardListItem flashcard={flashcard} onAccept={onAccept} onEdit={onEdit} onReject={onReject} />
        </div>
      ))}
    </div>
  );
}
