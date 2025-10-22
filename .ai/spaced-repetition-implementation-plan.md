# 🎓 Spaced Repetition (US-008) - Plan Implementacji

## 1. Cel

Implementacja w pełni funkcjonalnej sesji nauki opartej na algorytmie FSRS (Free Spaced Repetition Scheduler), która pozwoli użytkownikom na efektywną naukę fiszek z wykorzystaniem metody powtórek w interwałach.

## 2. Wybór technologii: `ts-fsrs`

Zgodnie z decyzją, wykorzystamy bibliotekę `ts-fsrs`.

- **Dlaczego `ts-fsrs`?**
  - **Nowoczesność:** Jest to algorytm nowszy i według badań skuteczniejszy niż klasyczne SM-2.
  - **Standard w Anki:** Od 2023 roku jest to domyślny algorytm w popularnej aplikacji Anki.
  - **Wsparcie dla TypeScript:** Natywne wsparcie ułatwi integrację i zapewni bezpieczeństwo typów.
  - **Elastyczność:** Choć domyślne parametry są dobrze zoptymalizowane, algorytm pozwala na przyszłe dostosowanie.

## 3. Zmiany w schemacie bazy danych

### 3.1. Rozszerzenie tabeli `flashcards`

Dodamy nowe kolumny do przechowywania aktualnego stanu każdej fiszki w algorytmie FSRS.

```sql
-- migration: add_fsrs_columns_to_flashcards
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS due timestamptz NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS stability real,
ADD COLUMN IF NOT EXISTS difficulty real,
ADD COLUMN IF NOT EXISTS elapsed_days integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_days integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reps integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS lapses integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS state varchar(20) NOT NULL DEFAULT 'New' CHECK (state IN ('New', 'Learning', 'Review', 'Relearning')),
ADD COLUMN IF NOT EXISTS last_review timestamptz;
```

### 3.2. Nowa tabela `reviews`

Stworzymy nową tabelę do logowania każdej oceny. Umożliwi to śledzenie historii nauki, budowanie statystyk i ewentualne ponowne przeliczanie harmonogramu.

```sql
-- migration: create_reviews_table
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigserial PRIMARY KEY,
    flashcard_id bigint NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 4), -- 1:Again, 2:Hard, 3:Good, 4:Easy
    state_before varchar(20),
    state_after varchar(20),
    review_duration integer, -- Czas w milisekundach spędzony na fiszce
    reviewed_at timestamptz NOT NULL DEFAULT now()
);

-- Włącz RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Dodaj polityki RLS
CREATE POLICY "Users can manage their own reviews"
ON public.reviews FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_reviews_flashcard_id ON public.reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
```

## 4. Implementacja Backend

### 4.1. Instalacja zależności

```bash
npm install ts-fsrs
```

### 4.2. Nowy serwis: `SpacedRepetitionService` (`src/lib/sr.service.ts`)

Serwis będzie odpowiedzialny za całą logikę związaną z FSRS.

- **`getStudySession(userId: string): Promise<Flashcard[]>`**
  - Pobiera z bazy fiszki dla danego `userId`, gdzie `due <= now()`.
  - Sortuje je (np. losowo lub po dacie `due`).
  - Zwraca listę fiszek do nauki.

- **`rateFlashcard(userId: string, flashcardId: number, rating: 1 | 2 | 3 | 4): Promise<Flashcard>`**
  1.  Pobiera fiszkę z bazy, aby uzyskać jej aktualny stan FSRS.
  2.  Inicjalizuje `fsrs()` i tworzy obiekt `card` na podstawie danych z bazy.
  3.  Wywołuje `fsrs.repeat(card, new Date())` aby przetworzyć ocenę.
  4.  Pobiera nowy, zaktualizowany stan fiszki z wyniku.
  5.  **W ramach transakcji bazodanowej:**
      a.  Aktualizuje rekord w tabeli `flashcards` nowymi wartościami (`due`, `stability`, `state` etc.).
      b.  Tworzy nowy wpis w tabeli `reviews` z informacjami o tej ocenie.
  6.  Zwraca zaktualizowaną fiszkę.

### 4.3. Nowe typy DTO (`src/types.ts`)

```typescript
// DTO do oceniania fiszki
export interface RateFlashcardDto {
  flashcardId: number;
  rating: 1 | 2 | 3 | 4;
}
```

### 4.4. Nowe API Endpoints

- **`GET /api/session`**
  - **Opis:** Pobiera listę fiszek do nauki na dzisiejszą sesję.
  - **Logika:** Wywołuje `SpacedRepetitionService.getStudySession()`.
  - **Odpowiedź:** `200 OK` z tablicą obiektów `FlashcardDto`.

- **`POST /api/session/rate`**
  - **Opis:** Zapisuje ocenę fiszki i aktualizuje jej harmonogram powtórek.
  - **Request Body:** `{ flashcardId: number, rating: 1 | 2 | 3 | 4 }`
  - **Logika:** Wywołuje `SpacedRepetitionService.rateFlashcard()`.
  - **Odpowiedź:** `200 OK` ze zaktualizowanym obiektem `FlashcardDto`.

## 5. Implementacja Frontend

### 5.1. Nowa strona: `src/pages/session.astro`

- Strona będzie chroniona przez middleware (tylko dla zalogowanych).
- Będzie renderować główny komponent Reactowy.

### 5.2. Komponent: `StudySessionView.tsx` (`src/components/StudySessionView.tsx`)

- **Stan komponentu:**
  - `cards: Flashcard[]` - lista fiszek w sesji.
  - `currentIndex: number` - indeks aktualnie wyświetlanej fiszki.
  - `isFlipped: boolean` - czy karta jest odwrócona.
  - `isLoading: boolean` - stan ładowania sesji.
  - `isFinished: boolean` - czy sesja została zakończona.

- **Logika:**
  1.  Po załadowaniu komponentu, hook `useEffect` wywołuje `GET /api/session` i zapisuje fiszki w stanie.
  2.  Wyświetla przód fiszki `cards[currentIndex]`.
  3.  Po kliknięciu przycisku "Obróć", zmienia stan `isFlipped` na `true` i wyświetla tył fiszki oraz przyciski oceny.
  4.  Po kliknięciu przycisku oceny (np. "Good"):
      a. Wywołuje `POST /api/session/rate` z `flashcardId` i `rating`.
      b. Po otrzymaniu odpowiedzi, przechodzi do następnej karty (`setCurrentIndex(currentIndex + 1)`).
      c. Resetuje `isFlipped` do `false`.
  5.  Gdy `currentIndex` osiągnie koniec tablicy, zmienia stan `isFinished` na `true` i wyświetla podsumowanie sesji.

- **UI:**
  - Karta fiszki z animacją obrotu.
  - Licznik postępu (np. "5 / 15").
  - 4 przyciski oceny: "Again", "Hard", "Good", "Easy" (mapowane na wartości 1-4).
  - Ekran podsumowania (np. "Gratulacje! Ukończyłeś sesję.").

### 5.3. Nowy hook: `useStudySession.ts`

- Opcjonalnie, można stworzyć custom hook, który enkapsuluje logikę fetcha i post'a, zarządzanie stanem ładowania i błędów, aby utrzymać komponent `StudySessionView` w czystości.

## 6. Plan Działania (Roadmap)

1.  **(Backend)** Utworzenie i uruchomienie migracji bazy danych (`add_fsrs_columns_to_flashcards` i `create_reviews_table`).
2.  **(Backend)** Instalacja `ts-fsrs`.
3.  **(Backend)** Implementacja `SpacedRepetitionService`.
4.  **(Backend)** Dodanie DTO i implementacja endpointów `GET /api/session` i `POST /api/session/rate`.
5.  **(Testy)** Opcjonalne: testy integracyjne dla nowych endpointów i serwisu.
6.  **(Frontend)** Utworzenie strony `session.astro` i dodanie linku w nawigacji.
7.  **(Frontend)** Stworzenie szkieletu komponentu `StudySessionView.tsx`.
8.  **(Frontend)** Implementacja logiki pobierania sesji i wyświetlania pierwszej fiszki.
9.  **(Frontend)** Implementacja mechanizmu obracania karty i wyświetlania ocen.
10. **(Frontend)** Implementacja logiki oceniania fiszki (wysyłanie requestu i przechodzenie do kolejnej).
11. **(Frontend)** Dodanie ekranu podsumowania sesji i obsługa stanu ładowania/błędów.
12. **(Testy E2E)** Opcjonalne: napisanie testu Playwright symulującego przejście całej sesji nauki.
