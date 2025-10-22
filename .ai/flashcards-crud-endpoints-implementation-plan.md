# API Endpoints Implementation Plan: GET, PUT, DELETE /flashcards

## 1. Przegląd punktów końcowych
Endpointy służą do pełnego zarządzania fiszkami użytkownika (CRUD - bez Create, które już istnieje):
- **GET /api/flashcards** - pobieranie listy fiszek z paginacją, filtrowaniem i sortowaniem
- **GET /api/flashcards/[id]** - pobieranie szczegółów pojedynczej fiszki
- **PUT /api/flashcards/[id]** - edycja istniejącej fiszki
- **DELETE /api/flashcards/[id]** - usunięcie fiszki

Wszystkie endpointy wymagają uwierzytelnienia i zapewniają dostęp tylko do danych użytkownika dzięki Row-Level Security (RLS).

---

## 2. GET /api/flashcards - Lista fiszek użytkownika

### 2.1. Szczegóły żądania
- **Metoda HTTP**: GET
- **URL**: `/api/flashcards`
- **Parametry Query String** (wszystkie opcjonalne):
  - `page` (number, default: 1) - numer strony
  - `limit` (number, default: 10, max: 100) - liczba elementów na stronę
  - `sort` (string, default: "created_at") - pole sortowania: `created_at`, `updated_at`, `front`, `source`
  - `order` (string, default: "desc") - kierunek sortowania: `asc`, `desc`
  - `source` (string, optional) - filtrowanie po źródle: `ai-full`, `ai-edited`, `manual`
  - `generation_id` (number, optional) - filtrowanie po ID generacji

### 2.2. Wykorzystywane typy
- **FlashcardsListResponseDto** - odpowiedź z listą i paginacją
- **FlashcardDto** - pojedyncza fiszka w liście
- **PaginationDto** - metadata paginacji

### 2.3. Szczegóły odpowiedzi
**Sukces (HTTP 200):**
```json
{
  "data": [
    {
      "id": 1,
      "front": "Pytanie",
      "back": "Odpowiedź",
      "source": "manual",
      "generation_id": null,
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42
  }
}
```

**Błędy:**
- 400: Nieprawidłowe parametry query (np. page < 1, limit > 100, niewłaściwy sort field)
- 401: Brak autoryzacji

### 2.4. Przepływ danych
1. Odbiór żądania GET z opcjonalnymi parametrami query
2. Walidacja parametrów za pomocą `zod`:
   - `page` >= 1
   - `limit` między 1 a 100
   - `sort` należy do dozwolonych wartości
   - `order` to `asc` lub `desc`
   - `source` należy do enum (jeśli podany)
3. Wywołanie `FlashcardService.getFlashcards(userId, filters, pagination)`
4. Zapytanie do Supabase z użyciem RLS (automatyczne filtrowanie po `user_id`)
5. Obliczenie total count dla paginacji
6. Zwrócenie danych zgodnych z `FlashcardsListResponseDto`

### 2.5. Względy bezpieczeństwa
- Uwierzytelnienie: Endpoint tylko dla zalogowanych użytkowników
- RLS zapewnia dostęp tylko do własnych fiszek
- Walidacja limitów (max 100 per page) przeciw DoS
- Sanitizacja parametrów sortowania (whitelist pól)

### 2.6. Obsługa błędów
- 400: Zwracane dla nieprawidłowych parametrów query z listą błędów walidacji
- 401: Zwracane gdy brak tokena lub token wygasł
- 500: Błąd serwera lub bazy danych

---

## 3. GET /api/flashcards/[id] - Szczegóły fiszki

### 3.1. Szczegóły żądania
- **Metoda HTTP**: GET
- **URL**: `/api/flashcards/[id]`
- **Parametry**:
  - `id` (number, route parameter) - ID fiszki

### 3.2. Wykorzystywane typy
- **FlashcardDto** - szczegóły fiszki

### 3.3. Szczegóły odpowiedzi
**Sukces (HTTP 200):**
```json
{
  "id": 1,
  "front": "Pytanie",
  "back": "Odpowiedź",
  "source": "ai-full",
  "generation_id": 123,
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

**Błędy:**
- 400: Nieprawidłowy format ID (nie jest liczbą)
- 401: Brak autoryzacji
- 404: Fiszka nie istnieje lub nie należy do użytkownika

### 3.4. Przepływ danych
1. Odbiór żądania GET z parametrem `id` w URL
2. Walidacja `id` (musi być liczbą > 0)
3. Wywołanie `FlashcardService.getFlashcardById(id, userId)`
4. Zapytanie do Supabase z RLS (zwróci null jeśli nie należy do użytkownika)
5. Zwrócenie danych lub 404

### 3.5. Względy bezpieczeństwa
- RLS automatycznie blokuje dostęp do cudzych fiszek
- Walidacja ID jako liczby dodatniej
- Nie ujawniamy czy fiszka istnieje ale należy do innego użytkownika (zawsze 404)

### 3.6. Obsługa błędów
- 400: ID nie jest prawidłową liczbą
- 404: Fiszka nie znaleziona (lub nie należy do użytkownika - nie ujawniamy różnicy)
- 500: Błąd serwera

---

## 4. PUT /api/flashcards/[id] - Edycja fiszki

### 4.1. Szczegóły żądania
- **Metoda HTTP**: PUT
- **URL**: `/api/flashcards/[id]`
- **Parametry**:
  - `id` (number, route parameter) - ID fiszki
  - Request Body (JSON):
    ```json
    {
      "front": "Zaktualizowane pytanie",
      "back": "Zaktualizowana odpowiedź"
    }
    ```

### 4.2. Wykorzystywane typy
- **FlashcardUpdateDto** - dane do aktualizacji (partial)
- **FlashcardDto** - zaktualizowana fiszka w odpowiedzi

### 4.3. Szczegóły odpowiedzi
**Sukces (HTTP 200):**
```json
{
  "id": 1,
  "front": "Zaktualizowane pytanie",
  "back": "Zaktualizowana odpowiedź",
  "source": "ai-edited",
  "generation_id": 123,
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T11:30:00Z"
}
```

**Błędy:**
- 400: Nieprawidłowe dane (przekroczenie limitów, brak wymaganych pól)
- 401: Brak autoryzacji
- 404: Fiszka nie istnieje lub nie należy do użytkownika

### 4.4. Przepływ danych
1. Odbiór żądania PUT z `id` w URL i danymi w body
2. Walidacja `id` (liczba > 0)
3. Walidacja danych za pomocą `zod`:
   - `front` (jeśli podany): max 200 znaków, niepusty po trim
   - `back` (jeśli podany): max 500 znaków, niepusty po trim
   - Przynajmniej jedno pole musi być podane
4. Logika biznesowa w `FlashcardService.updateFlashcard(id, userId, data)`:
   - Sprawdzenie czy fiszka istnieje i należy do użytkownika (RLS)
   - Automatyczna zmiana `source` z `ai-full` na `ai-edited` jeśli była generowana
   - Aktualizacja pól
   - Trigger automatycznie ustawia `updated_at`
5. Zwrócenie zaktualizowanej fiszki

### 4.5. Względy bezpieczeństwa
- RLS blokuje edycję cudzych fiszek
- Walidacja długości pól zgodnie z ograniczeniami DB
- Sanitizacja input (trim, sprawdzenie na puste stringi)
- Nie pozwalamy na zmianę `user_id`, `created_at`, `id`

### 4.6. Obsługa błędów
- 400: Nieprawidłowe dane wejściowe z listą błędów walidacji
- 404: Fiszka nie znaleziona
- 500: Błąd zapisu do bazy

### 4.7. Logika biznesowa - zmiana source
**Reguła**: Jeśli edytujemy fiszkę która ma `source: "ai-full"`, automatycznie zmieniamy na `"ai-edited"`.

Pozostałe przypadki:
- `"ai-edited"` → pozostaje `"ai-edited"`
- `"manual"` → pozostaje `"manual"`

---

## 5. DELETE /api/flashcards/[id] - Usunięcie fiszki

### 5.1. Szczegóły żądania
- **Metoda HTTP**: DELETE
- **URL**: `/api/flashcards/[id]`
- **Parametry**:
  - `id` (number, route parameter) - ID fiszki do usunięcia

### 5.2. Wykorzystywane typy
- Brak - odpowiedź to tylko status message

### 5.3. Szczegóły odpowiedzi
**Sukces (HTTP 200):**
```json
{
  "success": true,
  "message": "Flashcard deleted successfully"
}
```

**Błędy:**
- 400: Nieprawidłowy format ID
- 401: Brak autoryzacji
- 404: Fiszka nie istnieje lub nie należy do użytkownika

### 5.4. Przepływ danych
1. Odbiór żądania DELETE z parametrem `id`
2. Walidacja `id` (liczba > 0)
3. Wywołanie `FlashcardService.deleteFlashcard(id, userId)`
4. Usunięcie z bazy (RLS zapewnia że tylko własne fiszki)
5. Zwrócenie sukcesu lub 404

### 5.5. Względy bezpieczeństwa
- RLS blokuje usuwanie cudzych fiszek
- Soft delete nie jest wymagany w MVP
- Hard delete z kaskadową aktualizacją odniesień (generation_id ON DELETE SET NULL)

### 5.6. Obsługa błędów
- 400: ID nie jest prawidłową liczbą
- 404: Fiszka nie znaleziona (lub nie należy do użytkownika)
- 500: Błąd usuwania z bazy

---

## 6. Rozważania dotyczące wydajności

### 6.1. GET /api/flashcards
- Indeks na `user_id` zapewnia szybkie filtrowanie
- Limit max 100 elementów per page
- Paginacja cursor-based możliwa w przyszłości dla lepszej wydajności
- Cache możliwy na poziomie klienta (stale-while-revalidate)

### 6.2. Pozostałe endpointy
- RLS indeksy automatycznie optymalizują zapytania
- Trigger `updated_at` działa efektywnie

---

## 7. Etapy wdrożenia

### Krok 1: Rozszerzenie FlashcardService
Plik: `src/lib/flashcard.service.ts`

Dodać metody:
```typescript
async getFlashcards(
  userId: string,
  filters?: { source?: string; generation_id?: number },
  pagination?: { page: number; limit: number; sort: string; order: string }
): Promise<FlashcardsListResponseDto>

async getFlashcardById(id: number, userId: string): Promise<FlashcardDto | null>

async updateFlashcard(
  id: number,
  userId: string,
  data: FlashcardUpdateDto
): Promise<FlashcardDto>

async deleteFlashcard(id: number, userId: string): Promise<void>
```

### Krok 2: Dodanie walidacji query params
Plik: `src/lib/validation.ts` (lub nowy plik)

```typescript
const flashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['created_at', 'updated_at', 'front', 'source']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  source: z.enum(['ai-full', 'ai-edited', 'manual']).optional(),
  generation_id: z.coerce.number().int().positive().optional(),
});

const flashcardIdSchema = z.coerce.number().int().positive();

const flashcardUpdateSchema = z.object({
  front: z.string().trim().min(1).max(200).optional(),
  back: z.string().trim().min(1).max(500).optional(),
}).refine(data => data.front || data.back, {
  message: "At least one field (front or back) must be provided"
});
```

### Krok 3: Implementacja GET /api/flashcards
Plik: `src/pages/api/flashcards.ts`

Rozszerzyć istniejący plik o:
```typescript
export const GET: APIRoute = async ({ request, locals, url }) => {
  // 1. Check auth
  // 2. Parse & validate query params
  // 3. Call FlashcardService.getFlashcards()
  // 4. Return FlashcardsListResponseDto
}
```

### Krok 4: Utworzenie Dynamic Route dla [id]
Plik: `src/pages/api/flashcards/[id].ts`

```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  // GET by ID
}

export const PUT: APIRoute = async ({ params, request, locals }) => {
  // UPDATE
}

export const DELETE: APIRoute = async ({ params, locals }) => {
  // DELETE
}
```

### Krok 5: Implementacja logiki source change
W `FlashcardService.updateFlashcard()`:
```typescript
// If editing ai-full flashcard, change to ai-edited
if (existingFlashcard.source === 'ai-full') {
  updateData.source = 'ai-edited';
}
```

### Krok 6: Testy jednostkowe
- Testy dla walidacji query params
- Testy dla FlashcardService (wszystkie nowe metody)
- Mock Supabase client

### Krok 7: Testy E2E (Playwright)
- Scenariusz: pobranie listy fiszek z różnymi filtrami
- Scenariusz: edycja fiszki (zmiana source ai-full → ai-edited)
- Scenariusz: usunięcie fiszki
- Scenariusz: próba dostępu do cudzej fiszki (404)

---

## 8. Przykładowa struktura plików

```
src/
├── pages/
│   └── api/
│       └── flashcards/
│           ├── index.ts              # GET, POST (już istnieje)
│           └── [id].ts               # GET, PUT, DELETE (NOWY)
├── lib/
│   ├── flashcard.service.ts          # Rozszerzony
│   └── validation.ts                 # Nowe schematy
└── types.ts                          # Już zdefiniowane typy
```

---

## 9. Checklist implementacji

Backend:
- [ ] Rozszerzenie `FlashcardService` o nowe metody
- [ ] Dodanie schematów walidacji w `validation.ts`
- [ ] Implementacja GET `/api/flashcards` (lista)
- [ ] Utworzenie `/api/flashcards/[id].ts`
- [ ] Implementacja GET `/api/flashcards/[id]`
- [ ] Implementacja PUT `/api/flashcards/[id]`
- [ ] Implementacja DELETE `/api/flashcards/[id]`
- [ ] Logika zmiany `source` (ai-full → ai-edited)
- [ ] Testy jednostkowe dla serwisu
- [ ] Testy E2E dla wszystkich endpointów

Dokumentacja:
- [ ] Aktualizacja API docs (jeśli istnieją)
- [ ] Dodanie przykładów użycia w README

