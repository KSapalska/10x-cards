import React, { useState, useEffect } from "react";
import type { FlashcardDto, RateFlashcardDto } from "../../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

const StudySessionView = () => {
  const [cards, setCards] = useState<FlashcardDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionFinished, setSessionFinished] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/session");
        if (!response.ok) {
          throw new Error(`Failed to fetch study session: ${response.statusText}`);
        }
        const data = await response.json();
        setCards(data);
        if (data.length === 0) {
          setSessionFinished(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  const handleRate = async (rating: 1 | 2 | 3 | 4) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const payload: RateFlashcardDto = {
        flashcardId: cards[currentIndex].id,
        rating,
      };

      const response = await fetch("/api/session/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to rate flashcard: ${response.statusText}`);
      }

      // Move to the next card or finish the session
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        setSessionFinished(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  if (isLoading) {
    return <div className="text-center">Loading study session...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (sessionFinished || cards.length === 0) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center">
        <CardTitle className="text-2xl font-semibold mb-4">All done for now!</CardTitle>
        <CardContent>
          <p>You have no more flashcards to review at the moment. Great job!</p>
        </CardContent>
      </Card>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      <Progress value={progress} />
      <Card className="min-h-[250px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm font-normal">
            Card {currentIndex + 1} of {cards.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center text-xl text-center">
          {isFlipped ? currentCard.back : currentCard.front}
        </CardContent>
      </Card>

      {isFlipped ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="destructive" onClick={() => handleRate(1)} disabled={isSubmitting}>
            Again
          </Button>
          <Button variant="secondary" onClick={() => handleRate(2)} disabled={isSubmitting}>
            Hard
          </Button>
          <Button variant="outline" onClick={() => handleRate(3)} disabled={isSubmitting}>
            Good
          </Button>
          <Button variant="default" onClick={() => handleRate(4)} disabled={isSubmitting}>
            Easy
          </Button>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button onClick={handleFlip}>Show Answer</Button>
        </div>
      )}
    </div>
  );
};

export default StudySessionView;
