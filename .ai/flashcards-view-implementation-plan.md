/*
Plan implementacji widoku "Moje fiszki"
*/

# Plan implementacji widoku "Moje fiszki"

## 1. Przegląd
Widok "Moje fiszki" umożliwia użytkownikowi przeglądanie wszystkich zapisanych fiszek (zarówno ręcznie utworzonych jak i wygenerowanych przez AI), ich edycję, usuwanie oraz ręczne dodawanie nowych fiszek. Widok wspiera paginację, sortowanie i filtrowanie dla lepszej organizacji dużych zbiorów fiszek.

**User Stories:** US-005 (edycja), US-006 (usuwanie), US-007 (ręczne tworzenie)

## 2. Routing widoku
Widok powinien być dostępny pod ścieżką `/flashcards`.

## 3. Struktura komponentów

### Hierarchia
```
FlashcardsView (główny kontener)
├── FlashcardsHeader
│   ├── PageTitle
│   ├── AddFlashcardButton
│   └── FilterSortControls (opcjonalne MVP)
├── FlashcardsGrid / FlashcardsList
│   └── FlashcardCard (wiele instancji)
│       ├── CardContent (front/back preview)
│       ├── CardActions
│       │   ├── EditButton
│       │   └── DeleteButton
│       └── CardMetadata (source, created_at)
├── Pagination
├── AddFlashcardModal
│   └── AddFlashcardForm
├── EditFlashcardModal
│   └── EditFlashcardForm
└── DeleteConfirmationDialog
```

## 4. Szczegóły komponentów

### 4.1. FlashcardsView
- **Opis**: Główny komponent widoku zarządzający stanem całej strony i orkiestrujący pozostałe komponenty.
- **Elementy**: Header, lista/grid fiszek, paginacja, modalne dialogi.
- **Zarządzanie stanem**:
  - Lista fiszek (pobrana z API)
  - Stan ładowania (`isLoading`)
  - Parametry paginacji (`page`, `limit`)
  - Parametry filtrowania i sortowania (opcjonalne)
  - Stan modalów (dodawanie, edycja, usuwanie)
  - Aktualnie edytowana/usuwana fiszka
- **Hooki**: 
  - `useFlashcards()` - custom hook do zarządzania listą fiszek
  - `useState` dla modalów
  - `useSearchParams` dla paginacji w URL (opcjonalne)
- **Typy**: `FlashcardsListResponseDto`, `FlashcardDto`
- **Propsy**: Brak (top-level component)

### 4.2. FlashcardsHeader
- **Opis**: Nagłówek strony z tytułem i przyciskiem dodawania.
- **Elementy**: 
  - Tytuł "Moje fiszki"
  - Licznik fiszek (np. "42 fiszki")
  - Przycisk "Dodaj fiszkę" (otwiera `AddFlashcardModal`)
  - FilterSortControls (opcjonalne w MVP)
- **Obsługiwane zdarzenia**: 
  - onClick przycisku "Dodaj fiszkę" → otwiera modal
- **Typy**: Licznik jako `number`
- **Propsy**: 
  - `totalCount: number`
  - `onAddClick: () => void`

### 4.3. FlashcardCard
- **Opis**: Pojedyncza karta reprezentująca fiszkę w widoku listy/grid.
- **Elementy**:
  - Przód fiszki (z ograniczeniem długości, np. 100 znaków + "...")
  - Tył fiszki (ukryty lub skrócony preview)
  - Badge ze źródłem (`ai-full`, `ai-edited`, `manual`)
  - Data utworzenia
  - Przyciski: "Edytuj", "Usuń"
- **Obsługiwane zdarzenia**:
  - onClick "Edytuj" → otwiera `EditFlashcardModal`
  - onClick "Usuń" → otwiera `DeleteConfirmationDialog`
  - onClick karty → rozwijanie/flip (opcjonalne)
- **Warunki walidacji**: Brak (tylko wyświetlanie)
- **Typy**: `FlashcardDto`
- **Propsy**:
  - `flashcard: FlashcardDto`
  - `onEdit: (flashcard: FlashcardDto) => void`
  - `onDelete: (flashcard: FlashcardDto) => void`

### 4.4. FlashcardsGrid / FlashcardsList
- **Opis**: Kontener wyświetlający wszystkie fiszki w formie grid lub listy.
- **Elementy**: Kolekcja `FlashcardCard` + EmptyState jeśli brak fiszek
- **Obsługiwane zdarzenia**: Przekazywanie callbacków do kart
- **Warunki walidacji**: Brak
- **Typy**: `FlashcardDto[]`
- **Propsy**:
  - `flashcards: FlashcardDto[]`
  - `isLoading: boolean`
  - `onEdit: (flashcard: FlashcardDto) => void`
  - `onDelete: (flashcard: FlashcardDto) => void`

### 4.5. Pagination
- **Opis**: Komponent paginacji umożliwiający nawigację między stronami.
- **Elementy**:
  - Przyciski: Pierwsza, Poprzednia, [numery stron], Następna, Ostatnia
  - Informacja: "Strona 1 z 5" lub "1-10 z 42"
- **Obsługiwane zdarzenia**: 
  - onClick dla każdego przycisku → zmiana `page`
  - onChange limitu (opcjonalne dropdown 10/25/50/100)
- **Warunki walidacji**: `page` >= 1 i <= totalPages
- **Typy**: `PaginationDto`
- **Propsy**:
  - `pagination: PaginationDto`
  - `onPageChange: (page: number) => void`
  - `onLimitChange?: (limit: number) => void`

### 4.6. AddFlashcardModal
- **Opis**: Modal do ręcznego dodawania nowej fiszki.
- **Elementy**:
  - Dialog overlay
  - Formularz z polami:
    - "Przód fiszki" (textarea, max 200 znaków)
    - "Tył fiszki" (textarea, max 500 znaków)
  - Liczniki znaków dla obu pól
  - Przyciski: "Anuluj", "Zapisz"
- **Obsługiwane zdarzenia**:
  - onChange dla pól (walidacja w czasie rzeczywistym)
  - onSubmit → wywołanie API POST /flashcards
  - onCancel → zamknięcie modala
- **Warunki walidacji**:
  - Front: 1-200 znaków (po trim)
  - Back: 1-500 znaków (po trim)
  - Oba pola wymagane
- **Typy**: 
  - Input: lokalny state z `front`, `back`
  - Output: `FlashcardCreateDto` z `source: "manual"`, `generation_id: null`
- **Propsy**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onSuccess: (flashcard: FlashcardDto) => void`

### 4.7. EditFlashcardModal
- **Opis**: Modal do edycji istniejącej fiszki.
- **Elementy**: Identyczne jak `AddFlashcardModal`, ale z wypełnionymi wartościami
- **Obsługiwane zdarzenia**:
  - onChange → walidacja
  - onSubmit → API PUT /flashcards/[id]
  - onCancel → zamknięcie bez zapisu
- **Warunki walidacji**: Jak w `AddFlashcardModal`
- **Logika biznesowa**:
  - Jeśli `source === "ai-full"` → po edycji backend zmieni na `"ai-edited"`
  - Pokazać użytkownikowi informację o tym (opcjonalne)
- **Typy**: 
  - Input: `FlashcardDto` (istniejąca fiszka)
  - Update payload: `FlashcardUpdateDto`
  - Output: zaktualizowana `FlashcardDto`
- **Propsy**:
  - `isOpen: boolean`
  - `flashcard: FlashcardDto | null`
  - `onClose: () => void`
  - `onSuccess: (flashcard: FlashcardDto) => void`

### 4.8. DeleteConfirmationDialog
- **Opis**: Dialog potwierdzenia usunięcia fiszki (zapobieganie przypadkowemu usunięciu).
- **Elementy**:
  - Alert dialog
  - Nagłówek: "Czy na pewno usunąć fiszkę?"
  - Treść: Preview przodu fiszki + ostrzeżenie "Ta akcja jest nieodwracalna"
  - Przyciski: "Anuluj" (secondary), "Usuń" (destructive/danger)
- **Obsługiwane zdarzenia**:
  - onClick "Usuń" → API DELETE /flashcards/[id]
  - onClick "Anuluj" → zamknięcie dialogu
- **Warunki walidacji**: Brak
- **Typy**: `FlashcardDto` (fiszka do usunięcia)
- **Propsy**:
  - `isOpen: boolean`
  - `flashcard: FlashcardDto | null`
  - `onClose: () => void`
  - `onConfirm: () => void`
  - `isDeleting: boolean` (loading state)

### 4.9. FilterSortControls (Opcjonalne w MVP)
- **Opis**: Kontrolki filtrowania i sortowania listy fiszek.
- **Elementy**:
  - Dropdown "Źródło": Wszystkie / AI (pełne) / AI (edytowane) / Ręczne
  - Dropdown "Sortuj po": Data utworzenia / Data edycji / Alfabetycznie
  - Toggle "Rosnąco/Malejąco"
- **Obsługiwane zdarzenia**: onChange → aktualizacja query params i reload listy
- **Typy**: Lokalne state z `source`, `sort`, `order`
- **Propsy**:
  - `filters: { source?, sort, order }`
  - `onChange: (filters) => void`

### 4.10. EmptyState
- **Opis**: Wyświetlany gdy użytkownik nie ma jeszcze żadnych fiszek.
- **Elementy**:
  - Ikona (np. pusty folder lub fiszka)
  - Nagłówek: "Nie masz jeszcze żadnych fiszek"
  - Opis: "Dodaj pierwszą fiszkę ręcznie lub wygeneruj je z tekstu"
  - Przyciski:
    - "Dodaj fiszkę" → otwiera `AddFlashcardModal`
    - "Generuj z tekstu" → przekierowanie do `/generate`
- **Obsługiwane zdarzenia**: onClick przycisków
- **Typy**: Brak
- **Propsy**:
  - `onAddClick: () => void`
  - `onGenerateClick: () => void`

### 4.11. SkeletonLoader
- **Opis**: Wyświetlany podczas ładowania listy fiszek.
- **Elementy**: Grid/lista skeleton cards (3-6 sztuk)
- **Typy**: Stateless
- **Propsy**: `count?: number` (ile skeleton cards)

## 5. Typy

### Istniejące w `src/types.ts`:
```typescript
FlashcardDto
FlashcardsListResponseDto
PaginationDto
FlashcardCreateDto
FlashcardUpdateDto
FlashcardsCreateCommand
Source
```

### Nowe typy lokalne (w komponencie):
```typescript
// Stan modalów
interface ModalState {
  add: boolean;
  edit: boolean;
  delete: boolean;
}

// Parametry listy (dla custom hook)
interface FlashcardsQueryParams {
  page: number;
  limit: number;
  sort?: 'created_at' | 'updated_at' | 'front' | 'source';
  order?: 'asc' | 'desc';
  source?: Source;
  generation_id?: number;
}
```

## 6. Zarządzanie stanem

### 6.1. Custom Hook: `useFlashcards()`
Hook zarządzający listą fiszek i operacjami CRUD.

```typescript
function useFlashcards(params: FlashcardsQueryParams) {
  const [data, setData] = useState<FlashcardsListResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch list
  const fetchFlashcards = async () => { /* GET /api/flashcards */ };
  
  // Reload (po dodaniu/edycji/usunięciu)
  const refetch = () => fetchFlashcards();

  useEffect(() => {
    fetchFlashcards();
  }, [params.page, params.limit, params.sort, params.order, params.source]);

  return { data, isLoading, error, refetch };
}
```

### 6.2. Custom Hook: `useAddFlashcard()`
```typescript
function useAddFlashcard() {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFlashcard = async (data: { front: string; back: string }) => {
    // POST /api/flashcards z source: "manual", generation_id: null
  };

  return { addFlashcard, isAdding, error };
}
```

### 6.3. Custom Hook: `useEditFlashcard()`
```typescript
function useEditFlashcard() {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editFlashcard = async (id: number, data: FlashcardUpdateDto) => {
    // PUT /api/flashcards/[id]
  };

  return { editFlashcard, isEditing, error };
}
```

### 6.4. Custom Hook: `useDeleteFlashcard()`
```typescript
function useDeleteFlashcard() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteFlashcard = async (id: number) => {
    // DELETE /api/flashcards/[id]
  };

  return { deleteFlashcard, isDeleting, error };
}
```

### 6.5. Stan lokalny w FlashcardsView
```typescript
const [modals, setModals] = useState<ModalState>({
  add: false,
  edit: false,
  delete: false,
});

const [selectedFlashcard, setSelectedFlashcard] = useState<FlashcardDto | null>(null);

const [queryParams, setQueryParams] = useState<FlashcardsQueryParams>({
  page: 1,
  limit: 10,
  sort: 'created_at',
  order: 'desc',
});
```

## 7. Integracja API

### 7.1. GET /api/flashcards (lista)
```typescript
const response = await fetch(`/api/flashcards?page=${page}&limit=${limit}&sort=${sort}&order=${order}`);
const data: FlashcardsListResponseDto = await response.json();
```

### 7.2. POST /api/flashcards (dodanie ręczne)
```typescript
const response = await fetch('/api/flashcards', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    flashcards: [{
      front: "Pytanie",
      back: "Odpowiedź",
      source: "manual",
      generation_id: null
    }]
  })
});
```

### 7.3. PUT /api/flashcards/[id] (edycja)
```typescript
const response = await fetch(`/api/flashcards/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ front: "...", back: "..." })
});
```

### 7.4. DELETE /api/flashcards/[id] (usunięcie)
```typescript
const response = await fetch(`/api/flashcards/${id}`, {
  method: 'DELETE'
});
```

## 8. Interakcje użytkownika

### Scenariusz 1: Przeglądanie fiszek
1. Użytkownik wchodzi na `/flashcards`
2. Widzi skeleton loader podczas ładowania
3. Lista fiszek się wyświetla (grid lub lista)
4. Użytkownik może:
   - Przewijać karty
   - Kliknąć "Następna strona" (paginacja)
   - Opcjonalnie: filtrować po źródle, sortować

### Scenariusz 2: Dodawanie fiszki ręcznie (US-007)
1. Użytkownik klika "Dodaj fiszkę"
2. Otwiera się `AddFlashcardModal`
3. Użytkownik wypełnia przód i tył (walidacja real-time)
4. Klika "Zapisz"
5. POST do API
6. Po sukcesie:
   - Modal się zamyka
   - Toast notification "Fiszka dodana"
   - Lista się odświeża (nowa fiszka na górze jeśli sort=created_at desc)

### Scenariusz 3: Edycja fiszki (US-005)
1. Użytkownik klika "Edytuj" na karcie
2. Otwiera się `EditFlashcardModal` z wypełnionymi wartościami
3. Użytkownik modyfikuje tekst
4. Klika "Zapisz"
5. PUT do API
6. Backend zmienia `source` z `ai-full` na `ai-edited` (jeśli dotyczy)
7. Po sukcesie:
   - Modal się zamyka
   - Toast "Fiszka zaktualizowana"
   - Karta odświeża się z nowymi danymi

### Scenariusz 4: Usuwanie fiszki (US-006)
1. Użytkownik klika "Usuń" na karcie
2. Otwiera się `DeleteConfirmationDialog` z preview fiszki
3. Użytkownik klika "Usuń" (lub "Anuluj")
4. Jeśli potwierdził: DELETE do API
5. Po sukcesie:
   - Dialog się zamyka
   - Toast "Fiszka usunięta"
   - Karta znika z listy (fade-out animation)
   - Jeśli była ostatnia na stronie → przejście do poprzedniej strony

## 9. Warunki i walidacja

### Frontend validation (real-time)
- **Przód fiszki**: 
  - Niepusty (po trim)
  - Max 200 znaków
  - Licznik: 0/200 (warning jeśli > 180)
- **Tył fiszki**:
  - Niepusty (po trim)
  - Max 500 znaków
  - Licznik: 0/500 (warning jeśli > 450)

### Backend validation
- Identyczna walidacja po stronie API
- Dodatkowa walidacja RLS (dostęp tylko do swoich fiszek)

## 10. Obsługa błędów

### Błędy API
- **401 Unauthorized**: Przekierowanie do `/auth/login`
- **404 Not Found**: Toast "Fiszka nie została znaleziona" + odświeżenie listy
- **400 Bad Request**: Wyświetlenie błędów walidacji pod formularzem
- **500 Server Error**: Toast "Wystąpił błąd. Spróbuj ponownie."

### Błędy sieci
- Timeout: Toast "Brak połączenia. Sprawdź internet."
- Retry mechanism (opcjonalny): Przycisk "Spróbuj ponownie"

### Optimistic UI (opcjonalne w MVP)
- Przy usuwaniu: natychmiast ukryj kartę, rollback jeśli błąd
- Przy edycji: natychmiast zaktualizuj UI, rollback jeśli błąd

## 11. Dostępność (a11y)

- Modalne dialogi z `role="dialog"`, `aria-labelledby`, `aria-describedby`
- Przyciski z odpowiednimi `aria-label` (np. "Usuń fiszkę: {front}")
- Keyboard navigation:
  - Enter → submit formularza
  - Escape → zamknięcie modala
  - Tab → focus na kolejne elementy
- Focus trap w modalach
- Komunikaty sukcesu/błędu z `role="alert"` lub `aria-live="polite"`

## 12. Responsywność

### Desktop (>1024px)
- Grid: 3 kolumny
- Modalne formularze: max-width 600px, wyśrodkowane

### Tablet (768px - 1024px)
- Grid: 2 kolumny
- Modal: szerokość 90%

### Mobile (<768px)
- Lista pionowa (nie grid)
- Modal: full-width z padding
- Przyciski stacked (nie obok siebie)

## 13. UI/UX usprawnienia

### Must-have (MVP)
- ✅ Skeleton loader podczas ładowania
- ✅ Empty state dla nowych użytkowników
- ✅ Toast notifications dla operacji CRUD
- ✅ Loading states na przyciskach (spinner + disabled)
- ✅ Potwierdzenie usunięcia
- ✅ Liczniki znaków w formularzach

### Nice-to-have (post-MVP)
- 🔄 Optimistic UI updates
- 🔄 Fade-out animation przy usuwaniu
- 🔄 Flip animation na karcie (przód/tył)
- 🔄 Drag-to-reorder (jeśli dodamy custom order)
- 🔄 Bulk actions (zaznacz wiele → usuń)
- 🔄 Search/filtrowanie po treści

## 14. Kroki implementacji

### Faza 1: Backend (z planu `flashcards-crud-endpoints-implementation-plan.md`)
1. ✅ Rozszerzenie `FlashcardService`
2. ✅ Implementacja GET, PUT, DELETE endpoints
3. ✅ Walidacja i testy

### Faza 2: Podstawowa struktura (1-2 dni)
1. Utworzenie strony `/flashcards.astro`
2. Główny komponent `FlashcardsView.tsx`
3. Custom hook `useFlashcards()` dla GET /api/flashcards
4. Skeleton loader i empty state

### Faza 3: Lista fiszek (1 dzień)
5. Komponent `FlashcardCard.tsx`
6. Komponent `FlashcardsGrid.tsx`
7. Badge dla źródła fiszki (ai-full/ai-edited/manual)
8. Podstawowe style

### Faza 4: Paginacja (0.5 dnia)
9. Komponent `Pagination.tsx`
10. Integracja z `useFlashcards()`

### Faza 5: Dodawanie fiszki (1 dzień)
11. Komponent `AddFlashcardModal.tsx`
12. Formularz z walidacją
13. Custom hook `useAddFlashcard()`
14. Integracja POST /api/flashcards

### Faza 6: Edycja fiszki (1 dzień)
15. Komponent `EditFlashcardModal.tsx`
16. Custom hook `useEditFlashcard()`
17. Integracja PUT /api/flashcards/[id]
18. Obsługa zmiany source (ai-full → ai-edited)

### Faza 7: Usuwanie fiszki (0.5 dnia)
19. Komponent `DeleteConfirmationDialog.tsx`
20. Custom hook `useDeleteFlashcard()`
21. Integracja DELETE /api/flashcards/[id]

### Faza 8: Toast notifications (0.5 dnia)
22. Dodanie toast systemu (np. Sonner lub custom)
23. Integracja we wszystkie operacje CRUD

### Faza 9: Filtrowanie i sortowanie (1 dzień - OPCJONALNE)
24. Komponent `FilterSortControls.tsx`
25. Rozszerzenie `useFlashcards()` o filters
26. Synchronizacja z URL query params

### Faza 10: Testy i dopracowanie (1-2 dni)
27. Testy jednostkowe dla hooków
28. Testy E2E (Playwright):
    - Dodawanie fiszki
    - Edycja fiszki
    - Usuwanie fiszki
    - Paginacja
29. Responsywność (mobile/tablet/desktop)
30. Dostępność (keyboard navigation, ARIA)
31. Error handling i edge cases

### Faza 11: Integracja z nawigacją
32. Dodanie linku "Moje fiszki" w `AuthHeader.tsx`
33. Breadcrumbs (opcjonalne)
34. Active state dla linku w nawigacji

## 15. Struktura plików

```
src/
├── pages/
│   └── flashcards.astro                    # Główna strona
├── components/
│   ├── flashcards/                         # NOWY KATALOG
│   │   ├── FlashcardsView.tsx             # Main component
│   │   ├── FlashcardsHeader.tsx
│   │   ├── FlashcardsGrid.tsx
│   │   ├── FlashcardCard.tsx
│   │   ├── AddFlashcardModal.tsx
│   │   ├── EditFlashcardModal.tsx
│   │   ├── DeleteConfirmationDialog.tsx
│   │   ├── Pagination.tsx
│   │   ├── FilterSortControls.tsx         # Opcjonalny
│   │   └── EmptyState.tsx
│   └── hooks/
│       ├── useFlashcards.ts               # NOWY
│       ├── useAddFlashcard.ts             # NOWY
│       ├── useEditFlashcard.ts            # NOWY
│       └── useDeleteFlashcard.ts          # NOWY
└── lib/
    └── flashcard.service.ts                # Rozszerzony (z backend)
```

## 16. Checklist implementacji

Frontend:
- [ ] Strona `/flashcards.astro`
- [ ] `FlashcardsView.tsx` (główny komponent)
- [ ] Custom hooks (useFlashcards, useAddFlashcard, useEditFlashcard, useDeleteFlashcard)
- [ ] `FlashcardCard.tsx`
- [ ] `FlashcardsGrid.tsx` + EmptyState
- [ ] `Pagination.tsx`
- [ ] `AddFlashcardModal.tsx` + formularz + walidacja
- [ ] `EditFlashcardModal.tsx` + formularz + walidacja
- [ ] `DeleteConfirmationDialog.tsx`
- [ ] Toast notifications (sukces/błąd)
- [ ] Skeleton loader
- [ ] Responsywność (mobile/tablet/desktop)
- [ ] Dostępność (a11y)
- [ ] Testy jednostkowe dla hooków
- [ ] Testy E2E (Playwright)
- [ ] Link w nawigacji (`AuthHeader.tsx`)

Opcjonalne (post-MVP):
- [ ] `FilterSortControls.tsx`
- [ ] URL query params dla paginacji
- [ ] Optimistic UI updates
- [ ] Animacje (fade-out, flip)
- [ ] Search po treści

---

## 17. Przykład użycia (kod)

### flashcards.astro
```astro
---
import Layout from "../layouts/Layout.astro";
import FlashcardsView from "../components/flashcards/FlashcardsView";

if (!Astro.locals.session) {
  return Astro.redirect("/auth/login?returnTo=/flashcards");
}
---

<Layout title="Moje fiszki - 10xCards" showHeader={true}>
  <main class="min-h-screen bg-background pt-16">
    <FlashcardsView client:load />
  </main>
</Layout>
```

### useFlashcards.ts (pseudo-kod)
```typescript
export function useFlashcards(params: FlashcardsQueryParams) {
  const [data, setData] = useState<FlashcardsListResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlashcards = async () => {
    setIsLoading(true);
    setError(null);
    
    const queryString = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      sort: params.sort || 'created_at',
      order: params.order || 'desc',
      ...(params.source && { source: params.source }),
      ...(params.generation_id && { generation_id: params.generation_id.toString() }),
    }).toString();

    try {
      const response = await fetch(`/api/flashcards?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [params.page, params.limit, params.sort, params.order, params.source, params.generation_id]);

  return { data, isLoading, error, refetch: fetchFlashcards };
}
```

---

**Szacowany czas implementacji:** 5-7 dni roboczych (full-time)
**Priorytet:** WYSOKI (core feature MVP)
**Zależności:** Backend endpoints (GET, PUT, DELETE) muszą być gotowe

