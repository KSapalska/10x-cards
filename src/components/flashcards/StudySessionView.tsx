import React, { useState, useEffect } from "react";
import type { FlashcardDto, RateFlashcardDto } from "../../types";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";

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
          throw new Error(`Nie udało się pobrać sesji nauki: ${response.statusText}`);
        }
        const data = await response.json();
        setCards(data);
        if (data.length === 0) {
          setSessionFinished(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
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
        throw new Error(`Nie udało się ocenić fiszki: ${response.statusText}`);
      }

      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        setSessionFinished(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  if (isLoading) {
    return <div className="text-center">Ładowanie sesji nauki...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Błąd: {error}</div>;
  }

  if (sessionFinished || cards.length === 0) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center">
        <CardTitle className="text-2xl font-semibold mb-4">Wszystko na dzisiaj!</CardTitle>
        <CardContent>
          <p>Nie masz więcej fiszek do powtórzenia w tym momencie. Dobra robota!</p>
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
            Fiszka {currentIndex + 1} z {cards.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center text-xl text-center">
          {isFlipped ? currentCard.back : currentCard.front}
        </CardContent>
      </Card>

      {isFlipped ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="destructive"
            onClick={() => handleRate(1)}
            disabled={isSubmitting}
          >
            Od nowa
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleRate(2)}
            disabled={isSubmitting}
          >
            Trudne
          </Button>
          <Button
            variant="default"
            onClick={() => handleRate(3)}
            disabled={isSubmitting}
          >
            Dobre
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRate(4)}
            disabled={isSubmitting}
          >
            Łatwe
          </Button>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button onClick={handleFlip}>Pokaż odpowiedź</Button>
        </div>
      )}
    </div>
  );
};

export default StudySessionView;
