import { useState } from "react";
import { TextInputArea } from "./TextInputArea";
import { GenerateButton } from "./GenerateButton";
import { SkeletonLoader } from "./SkeletonLoader";
import { FlashcardListItem } from "./FlashcardListItem";
import { ErrorNotification } from "./ErrorNotification";
import { BulkSaveButton } from "./BulkSaveButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import type { FlashcardProposalViewModel } from "./FlashcardGenerationView";

export default function KitchenSink() {
  const [textShort, setTextShort] = useState("Krótki tekst");
  const [textValid, setTextValid] = useState("A".repeat(1500));
  const [textLong, setTextLong] = useState("A".repeat(11000));
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(true);

  // Mock flashcards for demonstration
  const mockFlashcards: FlashcardProposalViewModel[] = [
    {
      id: "1",
      front: "Co to jest React?",
      back: "React to biblioteka JavaScript do budowania interfejsów użytkownika",
      source: "ai-full",
      accepted: false,
      edited: false,
    },
    {
      id: "2",
      front: "Czym jest hook useState?",
      back: "useState to hook Reacta, który pozwala dodać stan do komponentów funkcyjnych",
      source: "ai-full",
      accepted: true,
      edited: false,
    },
    {
      id: "3",
      front: "Co to jest TypeScript?",
      back: "TypeScript to nadzbiór JavaScriptu z opcjonalnym typowaniem statycznym (EDYTOWANE)",
      source: "ai-edited",
      accepted: false,
      edited: true,
    },
  ];

  const [flashcards, setFlashcards] = useState<FlashcardProposalViewModel[]>(mockFlashcards);

  const handleAccept = (id: string) => {
    setFlashcards((prev) => prev.map((f) => (f.id === id ? { ...f, accepted: !f.accepted } : f)));
  };

  const handleEdit = (id: string, front: string, back: string) => {
    setFlashcards((prev) =>
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
    setFlashcards((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleLoading = () => {
    setIsLoading(!isLoading);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Kitchen Sink</h1>
        <p className="text-lg text-muted-foreground">Prezentacja wszystkich komponentów UI dla 10xCards</p>
      </div>

      <div className="space-y-12">
        {/* Section: Text Input Area */}
        <section>
          <h2 className="text-2xl font-bold mb-4">TextInputArea</h2>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stan: Za krótki tekst</CardTitle>
                <CardDescription>Tekst poniżej minimalnej długości (1000 znaków)</CardDescription>
              </CardHeader>
              <CardContent>
                <TextInputArea
                  value={textShort}
                  onChange={setTextShort}
                  textLength={textShort.length}
                  isValid={textShort.length >= 1000 && textShort.length <= 10000}
                  disabled={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stan: Prawidłowy tekst</CardTitle>
                <CardDescription>Tekst w prawidłowym zakresie (1000-10000 znaków)</CardDescription>
              </CardHeader>
              <CardContent>
                <TextInputArea
                  value={textValid}
                  onChange={setTextValid}
                  textLength={textValid.length}
                  isValid={textValid.length >= 1000 && textValid.length <= 10000}
                  disabled={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stan: Za długi tekst</CardTitle>
                <CardDescription>Tekst przekraczający maksymalną długość (10000 znaków)</CardDescription>
              </CardHeader>
              <CardContent>
                <TextInputArea
                  value={textLong}
                  onChange={setTextLong}
                  textLength={textLong.length}
                  isValid={textLong.length >= 1000 && textLong.length <= 10000}
                  disabled={false}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Generate Button */}
        <section>
          <h2 className="text-2xl font-bold mb-4">GenerateButton</h2>
          <Card>
            <CardHeader>
              <CardTitle>Różne stany przycisku</CardTitle>
              <CardDescription>Przycisk w stanach: normalny, disabled, loading</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Stan: Normalny</p>
                  <GenerateButton onClick={() => alert("Kliknięto!")} disabled={false} isLoading={false} />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Stan: Disabled</p>
                  <GenerateButton
                    onClick={() => {
                      /* disabled - no action */
                    }}
                    disabled={true}
                    isLoading={false}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Stan: Loading</p>
                  <GenerateButton
                    onClick={() => {
                      /* loading - no action */
                    }}
                    disabled={false}
                    isLoading={true}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={toggleLoading} variant="outline">
                  {isLoading ? "Zatrzymaj ładowanie" : "Symuluj ładowanie"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section: Skeleton Loader */}
        <section>
          <h2 className="text-2xl font-bold mb-4">SkeletonLoader</h2>
          <Card>
            <CardHeader>
              <CardTitle>Animacja ładowania</CardTitle>
              <CardDescription>Skeleton loader wyświetlany podczas generowania fiszek</CardDescription>
            </CardHeader>
            <CardContent>
              <SkeletonLoader count={3} />
            </CardContent>
          </Card>
        </section>

        {/* Section: Flashcard List Item */}
        <section>
          <h2 className="text-2xl font-bold mb-4">FlashcardListItem</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Różne stany fiszek</CardTitle>
                <CardDescription>Fiszki w różnych stanach: zwykła, zaakceptowana, edytowana</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {flashcards.map((flashcard) => (
                  <FlashcardListItem
                    key={flashcard.id}
                    flashcard={flashcard}
                    onAccept={handleAccept}
                    onEdit={handleEdit}
                    onReject={handleReject}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Error Notification */}
        <section>
          <h2 className="text-2xl font-bold mb-4">ErrorNotification</h2>
          <Card>
            <CardHeader>
              <CardTitle>Komunikaty błędów</CardTitle>
              <CardDescription>Różne typy komunikatów o błędach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showError && (
                <ErrorNotification
                  message="To jest przykładowy komunikat o błędzie"
                  onDismiss={() => setShowError(false)}
                />
              )}

              {!showError && (
                <Button onClick={() => setShowError(true)} variant="outline">
                  Pokaż błąd ponownie
                </Button>
              )}

              <ErrorNotification message="Błąd walidacji: Tekst musi zawierać od 1000 do 10000 znaków" />

              <ErrorNotification message="Błąd serwera: Nie udało się wygenerować fiszek. Spróbuj ponownie później." />
            </CardContent>
          </Card>
        </section>

        {/* Section: Bulk Save Button */}
        <section>
          <h2 className="text-2xl font-bold mb-4">BulkSaveButton</h2>
          <Card>
            <CardHeader>
              <CardTitle>Przyciski zapisu zbiorczego</CardTitle>
              <CardDescription>Zapis wszystkich lub tylko zaakceptowanych fiszek</CardDescription>
            </CardHeader>
            <CardContent>
              <BulkSaveButton
                flashcards={flashcards}
                generationId={123}
                onSuccess={() => alert("Sukces! Fiszki zostały zapisane.")}
                onError={(error) => alert(`Błąd: ${error}`)}
              />
            </CardContent>
          </Card>
        </section>

        {/* Section: UI Components from Shadcn */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Komponenty UI (Shadcn)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Przyciski</CardTitle>
                <CardDescription>Różne warianty przycisków</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rozmiary przycisków</CardTitle>
                <CardDescription>Różne rozmiary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Color Palette */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Paleta kolorów</h2>
          <Card>
            <CardHeader>
              <CardTitle>Kolory motywu</CardTitle>
              <CardDescription>Automatycznie dostosowują się do trybu jasnego/ciemnego</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-background border" />
                  <p className="text-sm font-medium">Background</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-foreground" />
                  <p className="text-sm font-medium">Foreground</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-primary" />
                  <p className="text-sm font-medium">Primary</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-secondary" />
                  <p className="text-sm font-medium">Secondary</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-destructive" />
                  <p className="text-sm font-medium">Destructive</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-muted" />
                  <p className="text-sm font-medium">Muted</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-accent" />
                  <p className="text-sm font-medium">Accent</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-card border" />
                  <p className="text-sm font-medium">Card</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-muted-foreground">
          <p>Kitchen Sink - Wszystkie komponenty 10xCards w jednym miejscu</p>
          <p className="mt-2">
            Użyj przełącznika motywu w prawym górnym rogu, aby zobaczyć komponenty w trybie ciemnym
          </p>
        </div>
      </div>
    </div>
  );
}
