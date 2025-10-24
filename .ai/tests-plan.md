# Plan Testów - 10x-cards

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu

Niniejszy dokument określa kompleksowy plan testów dla aplikacji **10x-cards** – platformy do tworzenia i nauki z fiszek edukacyjnych wspieranych sztuczną inteligencją. Plan ten ma na celu zapewnienie wysokiej jakości, bezpieczeństwa i niezawodności systemu przed wdrożeniem na środowisko produkcyjne.

### 1.2 Cele testowania

- **Weryfikacja funkcjonalności**: Potwierdzenie, że wszystkie funkcje działają zgodnie z wymaganiami biznesowymi
- **Zapewnienie bezpieczeństwa**: Walidacja mechanizmów autentykacji, autoryzacji i Row Level Security (RLS) w Supabase
- **Walidacja integracji**: Weryfikacja poprawności komunikacji z zewnętrznymi usługami (OpenRouter API, Supabase)
- **Optymalizacja wydajności**: Identyfikacja i eliminacja wąskich gardeł wydajnościowych
- **Zapewnienie zgodności z GDPR**: Weryfikacja możliwości usuwania danych użytkownika
- **Osiągnięcie metryki sukcesu**: ≥75% akceptacji fiszek generowanych przez AI

### 1.3 Zakres zastosowania

Plan obejmuje wszystkie komponenty aplikacji 10x-cards, w tym:

- Frontend (Astro 5, React 19, TypeScript)
- Backend API endpoints
- Integrację z Supabase (PostgreSQL, Auth)
- Integrację z OpenRouter AI API
- Middleware i zarządzanie sesjami
- Warstwy serwisowe (Services)

---

## 2. Zakres testów

### 2.1 Komponenty objęte testami

#### 2.1.1 Frontend

- Strony Astro (SSR/SSG rendering)
- Komponenty React (interactive islands)
- Custom hooks (`useGenerateFlashcards`, `useTheme`)
- Formularze autentykacji (login, register, password reset)
- UI components (shadcn/ui)
- Zarządzanie stanem lokalnym

#### 2.1.2 Backend

- API endpoints (`/api/generations`, `/api/flashcards`, `/api/auth/*`)
- Services (`AuthService`, `GenerationService`, `FlashcardService`, `OpenRouterService`)
- Middleware (session management, authentication)
- Walidacja danych (Zod schemas)

#### 2.1.3 Baza danych

- Supabase RLS policies
- Migracje schematu
- Triggery (`set_updated_at`)
- Indeksy i wydajność zapytań

#### 2.1.4 Integracje zewnętrzne

- OpenRouter API (generowanie fiszek przez AI)
- Supabase Auth (zarządzanie użytkownikami)
- Email delivery (password reset, confirmations)

### 2.2 Komponenty wyłączone z testów

- Infrastruktura DigitalOcean (testowana manualnie przez DevOps)
- GitHub Actions workflows (testowane przez CI/CD)
- Zewnętrzne zależności npm (zakładamy poprawność bibliotek third-party)

---

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe (Unit Tests)

**Narzędzie**: Vitest  
**Zakres**:

- Funkcje pomocnicze (`utils.ts`)
- Schematy walidacji Zod (`validation.ts`)
- Logika biznesowa w services
- Funkcje hash i kryptograficzne
- Komponenty React w izolacji

**Cel**: Weryfikacja poprawności pojedynczych jednostek kodu w izolacji

**Przykładowe testy**:

```typescript
// validation.ts
describe("generateFlashcardsCommandSchema", () => {
  it("should accept valid source text between 1000-10000 characters", () => {
    const validText = "a".repeat(5000);
    expect(() => generateFlashcardsCommandSchema.parse({ source_text: validText })).not.toThrow();
  });

  it("should reject text shorter than 1000 characters", () => {
    const shortText = "a".repeat(999);
    expect(() => generateFlashcardsCommandSchema.parse({ source_text: shortText })).toThrow();
  });

  it("should reject text longer than 10000 characters", () => {
    const longText = "a".repeat(10001);
    expect(() => generateFlashcardsCommandSchema.parse({ source_text: longText })).toThrow();
  });
});

// utils.ts (example)
describe("calculateHash", () => {
  it("should generate consistent MD5 hash for same input", () => {
    const text = "test input";
    const hash1 = calculateHash(text);
    const hash2 = calculateHash(text);
    expect(hash1).toBe(hash2);
  });

  it("should generate different hashes for different inputs", () => {
    const hash1 = calculateHash("input1");
    const hash2 = calculateHash("input2");
    expect(hash1).not.toBe(hash2);
  });
});
```

### 3.2 Testy integracyjne (Integration Tests)

**Narzędzie**: Vitest + Supabase Test Client  
**Zakres**:

- Integracja services z Supabase
- API endpoints z pełnym stackiem (request → validation → service → database)
- Middleware z autentykacją
- OpenRouter API integration (z mockowaniem)

**Cel**: Weryfikacja współpracy między komponentami systemu

**Przykładowe scenariusze**:

```typescript
describe("GenerationService Integration", () => {
  it("should save generation metadata to database after AI call", async () => {
    const service = new GenerationService(supabaseClient, mockApiKey);
    const result = await service.generateFlashcards(validSourceText, userId);

    const { data } = await supabaseClient.from("generations").select().eq("id", result.generation_id).single();

    expect(data).toBeDefined();
    expect(data.generated_count).toBe(result.generated_count);
  });

  it("should log errors to generation_error_logs on AI failure", async () => {
    // Mock OpenRouter to throw error
    const service = new GenerationService(supabaseClient, "invalid-key");

    await expect(service.generateFlashcards(validSourceText, userId)).rejects.toThrow();

    const { data } = await supabaseClient.from("generation_error_logs").select().eq("user_id", userId);

    expect(data.length).toBeGreaterThan(0);
  });
});
```

### 3.3 Testy end-to-end (E2E Tests)

**Narzędzie**: Playwright  
**Zakres**:

- Pełne przepływy użytkownika (user journeys)
- Interakcje z UI
- Nawigacja między stronami
- Formularze i walidacja kliencka

**Cel**: Weryfikacja działania aplikacji z perspektywy użytkownika końcowego

**Przykładowe scenariusze**:

```typescript
test("User can register, login, and generate flashcards", async ({ page }) => {
  // 1. Rejestracja
  await page.goto("/auth/register");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "Test123!@#");
  await page.fill('[name="confirmPassword"]', "Test123!@#");
  await page.click('button[type="submit"]');

  // 2. Logowanie
  await page.goto("/auth/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "Test123!@#");
  await page.click('button[type="submit"]');

  // 3. Oczekiwanie na przekierowanie
  await page.waitForURL("/generate");

  // 4. Generowanie fiszek
  const sourceText = "Lorem ipsum...".repeat(100); // 1000+ chars
  await page.fill('textarea[name="sourceText"]', sourceText);
  await page.click('button:has-text("Generuj fiszki")');

  // 5. Weryfikacja wyniku
  await page.waitForSelector(".flashcard-proposal");
  const flashcards = await page.locator(".flashcard-proposal").count();
  expect(flashcards).toBeGreaterThan(0);
});

test("Unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/generate");
  await page.waitForURL(/\/auth\/login/);
  expect(page.url()).toContain("/auth/login");
});
```

### 3.4 Testy bezpieczeństwa (Security Tests)

**Narzędzie**: Vitest + Manual Testing  
**Zakres**:

- Row Level Security (RLS) policies
- SQL injection prevention
- XSS prevention
- CSRF protection
- Session management
- Authorization checks

**Cel**: Zapewnienie bezpieczeństwa danych użytkowników i systemu

**Przykładowe scenariusze**:

```typescript
describe("RLS Security Tests", () => {
  it("should prevent user A from accessing user B flashcards", async () => {
    const userAClient = createSupabaseClient(userAToken);

    const { data, error } = await userAClient.from("flashcards").select().eq("user_id", userBId);

    expect(data).toEqual([]);
    expect(error).toBeDefined(); // RLS should block this
  });

  it("should prevent anonymous users from inserting flashcards", async () => {
    const anonClient = createSupabaseClient(); // No auth token

    const { error } = await anonClient.from("flashcards").insert({
      front: "Test",
      back: "Test",
      source: "manual",
      user_id: userId,
    });

    expect(error).toBeDefined();
    expect(error.code).toBe("42501"); // Insufficient privilege
  });
});

describe("Input Validation Security", () => {
  it("should sanitize HTML in flashcard content", () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    const result = validateFlashcardInput(maliciousInput);
    expect(result).not.toContain("<script>");
  });

  it("should reject SQL injection attempts", () => {
    const maliciousInput = "'; DROP TABLE flashcards; --";
    expect(() => generateFlashcardsCommandSchema.parse({ source_text: maliciousInput })).toThrow();
  });
});
```

### 3.5 Testy wydajnościowe (Performance Tests)

**Narzędzie**: Playwright + Lighthouse CI  
**Zakres**:

- Czas ładowania stron
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Czas odpowiedzi API
- Wydajność zapytań do bazy danych

**Cel**: Zapewnienie responsywności i optymalizacji doświadczenia użytkownika

**Metryki docelowe**:

- TTFB < 200ms
- FCP < 1.5s
- LCP < 2.5s
- API response time < 500ms (bez AI call)
- AI generation time < 10s

**Przykładowe testy**:

```typescript
test("Performance: Generate page loads within 2 seconds", async ({ page }) => {
  const startTime = Date.now();
  await page.goto("/generate");
  await page.waitForLoadState("networkidle");
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(2000);
});

test("Performance: API responds within 500ms", async () => {
  const startTime = Date.now();
  const response = await fetch("/api/flashcards", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const responseTime = Date.now() - startTime;

  expect(response.ok).toBe(true);
  expect(responseTime).toBeLessThan(500);
});
```

### 3.6 Testy regresji (Regression Tests)

**Narzędzie**: Vitest + Playwright  
**Zakres**: Automatyczne uruchamianie wszystkich testów po każdej zmianie kodu

**Cel**: Zapewnienie, że nowe zmiany nie psują istniejącej funkcjonalności

### 3.7 Testy akceptacyjne użytkownika (UAT)

**Narzędzie**: Manual Testing  
**Zakres**: Weryfikacja przez product ownera/użytkowników końcowych

**Cel**: Potwierdzenie zgodności z wymaganiami biznesowymi

---

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Autentykacja użytkowników

#### 4.1.1 Rejestracja

**Priorytet**: Krytyczny  
**Przypadki testowe**:

| ID           | Opis                                 | Kroki                                                                                                                                                                                        | Oczekiwany rezultat                                               |
| ------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| AUTH-REG-001 | Rejestracja z poprawnymi danymi      | 1. Przejdź do `/auth/register`<br>2. Wypełnij email (valid format)<br>3. Wypełnij hasło (min 8 znaków, 1 wielka, 1 cyfra, 1 specjalny)<br>4. Potwierdź hasło<br>5. Kliknij "Zarejestruj się" | Użytkownik zostaje zarejestrowany, otrzymuje email potwierdzający |
| AUTH-REG-002 | Rejestracja z istniejącym emailem    | 1. Użyj email który już istnieje w systemie<br>2. Wypełnij pozostałe pola<br>3. Kliknij "Zarejestruj się"                                                                                    | Błąd: "Konto z tym adresem email już istnieje"                    |
| AUTH-REG-003 | Rejestracja ze słabym hasłem         | 1. Wypełnij email<br>2. Użyj hasła "test123" (brak wielkiej litery i znaku specjalnego)<br>3. Kliknij "Zarejestruj się"                                                                      | Błąd walidacji: wymagania dotyczące hasła                         |
| AUTH-REG-004 | Rejestracja z niezgodnymi hasłami    | 1. Wypełnij email<br>2. Hasło: "Test123!@#"<br>3. Potwierdzenie: "Test123!@"<br>4. Kliknij "Zarejestruj się"                                                                                 | Błąd: "Hasła nie są identyczne"                                   |
| AUTH-REG-005 | Rejestracja z nieprawidłowym emailem | 1. Email: "invalid-email"<br>2. Wypełnij pozostałe pola                                                                                                                                      | Błąd: "Nieprawidłowy format adresu email"                         |

#### 4.1.2 Logowanie

**Priorytet**: Krytyczny  
**Przypadki testowe**:

| ID           | Opis                                | Kroki                                                                                                                            | Oczekiwany rezultat                                          |
| ------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| AUTH-LOG-001 | Logowanie z poprawnymi danymi       | 1. Przejdź do `/auth/login`<br>2. Wypełnij email i hasło<br>3. Kliknij "Zaloguj się"                                             | Użytkownik zostaje zalogowany, przekierowanie na `/generate` |
| AUTH-LOG-002 | Logowanie z błędnym hasłem          | 1. Użyj prawidłowego email<br>2. Użyj błędnego hasła<br>3. Kliknij "Zaloguj się"                                                 | Błąd: "Nieprawidłowe dane logowania"                         |
| AUTH-LOG-003 | Logowanie z nieistniejącym emailem  | 1. Użyj email który nie istnieje<br>2. Wypełnij hasło                                                                            | Błąd: "Nieprawidłowe dane logowania"                         |
| AUTH-LOG-004 | Remember me functionality           | 1. Zaznacz "Zapamiętaj mnie"<br>2. Zaloguj się<br>3. Zamknij przeglądarkę<br>4. Otwórz ponownie                                  | Użytkownik nadal zalogowany (cookie 30 dni)                  |
| AUTH-LOG-005 | Return to original page after login | 1. Jako niezalogowany, próbuj dostać się na `/generate`<br>2. Zostań przekierowany na login z `returnTo` param<br>3. Zaloguj się | Przekierowanie na `/generate`                                |

#### 4.1.3 Reset hasła

**Priorytet**: Wysoki  
**Przypadki testowe**:

| ID           | Opis                                    | Kroki                                                                                                                | Oczekiwany rezultat                                              |
| ------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| AUTH-RST-001 | Request reset dla istniejącego konta    | 1. Przejdź do `/auth/forgot-password`<br>2. Podaj email<br>3. Kliknij "Wyślij link"                                  | Email z linkiem resetującym wysłany                              |
| AUTH-RST-002 | Request reset dla nieistniejącego konta | 1. Podaj nieistniejący email<br>2. Kliknij "Wyślij link"                                                             | Komunikat sukcesu (bez ujawniania czy email istnieje - security) |
| AUTH-RST-003 | Reset hasła z poprawnym tokenem         | 1. Kliknij link z email<br>2. Wpisz nowe hasło (spełnia wymagania)<br>3. Potwierdź hasło<br>4. Kliknij "Zmień hasło" | Hasło zmienione, przekierowanie na login                         |
| AUTH-RST-004 | Reset hasła z wygasłym tokenem          | 1. Użyj linku starszego niż 1h<br>2. Próbuj zmienić hasło                                                            | Błąd: "Token resetowania jest nieprawidłowy lub wygasł"          |

### 4.2 Generowanie fiszek przez AI

#### 4.2.1 Podstawowa funkcjonalność

**Priorytet**: Krytyczny (core feature)  
**Przypadki testowe**:

| ID      | Opis                                                | Kroki                                                                                                    | Oczekiwany rezultat                                      |
| ------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| GEN-001 | Generowanie z poprawnym tekstem (1000-10000 znaków) | 1. Zaloguj się<br>2. Przejdź na `/generate`<br>3. Wklej tekst 5000 znaków<br>4. Kliknij "Generuj fiszki" | 5-15 propozycji fiszek, generation_id zapisane w DB      |
| GEN-002 | Generowanie z tekstem za krótkim (<1000 znaków)     | 1. Wklej tekst 999 znaków<br>2. Kliknij "Generuj"                                                        | Błąd: "Tekst musi zawierać od 1000 do 10000 znaków"      |
| GEN-003 | Generowanie z tekstem za długim (>10000 znaków)     | 1. Wklej tekst 10001 znaków<br>2. Kliknij "Generuj"                                                      | Błąd: "Tekst musi zawierać od 1000 do 10000 znaków"      |
| GEN-004 | Licznik znaków w UI                                 | 1. Wpisuj tekst w textarea                                                                               | Licznik aktualizuje się live: "X/10000"                  |
| GEN-005 | Loading state podczas generowania                   | 1. Kliknij "Generuj"<br>2. Obserwuj UI                                                                   | Spinner/loader, button disabled, komunikat "Generuję..." |
| GEN-006 | Generowanie w języku polskim                        | 1. Wklej tekst polski<br>2. Wygeneruj fiszki                                                             | Fiszki w języku polskim                                  |
| GEN-007 | Generowanie w języku angielskim                     | 1. Wklej tekst angielski<br>2. Wygeneruj fiszki                                                          | Fiszki w języku angielskim                               |

#### 4.2.2 Obsługa błędów AI

**Priorytet**: Wysoki  
**Przypadki testowe**:

| ID          | Opis                      | Kroki                                                             | Oczekiwany rezultat                             |
| ----------- | ------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| GEN-ERR-001 | OpenRouter API timeout    | 1. Symuluj timeout (>30s)<br>2. Kliknij "Generuj"                 | Błąd z komunikatem, log w generation_error_logs |
| GEN-ERR-002 | OpenRouter API rate limit | 1. Wykonaj wiele requestów szybko<br>2. Przekrocz limit           | Błąd 429, komunikat użytkownikowi               |
| GEN-ERR-003 | Invalid API key           | 1. Ustaw błędny OPENROUTER_API_KEY<br>2. Próbuj generować         | Błąd 401, log błędu                             |
| GEN-ERR-004 | Malformed AI response     | 1. Symuluj odpowiedź bez pola "flashcards"<br>2. Próbuj sparsować | Błąd: "Invalid response structure", log błędu   |
| GEN-ERR-005 | Empty flashcards array    | 1. AI zwraca {flashcards: []}<br>2. Próbuj przetworzyć            | Błąd: "No flashcards generated", log błędu      |

#### 4.2.3 Metadata generacji

**Priorytet**: Średni  
**Przypadki testowe**:

| ID           | Opis                       | Kroki                                                           | Oczekiwany rezultat                                                              |
| ------------ | -------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| GEN-META-001 | Zapis metadanych do DB     | 1. Wygeneruj fiszki<br>2. Sprawdź tabelę `generations`          | Record z: user_id, model, generated_count, source_text_hash, generation_duration |
| GEN-META-002 | Hash tekstu źródłowego     | 1. Wygeneruj fiszki 2x z tym samym tekstem<br>2. Porównaj hashe | Ten sam MD5 hash w obu rekordach                                                 |
| GEN-META-003 | Tracking czasu generowania | 1. Wygeneruj fiszki<br>2. Sprawdź generation_duration           | Czas w ms, wartość > 0                                                           |

### 4.3 Zarządzanie fiszkami

#### 4.3.1 Akceptacja propozycji

**Priorytet**: Krytyczny  
**Przypadki testowe**:

| ID            | Opis                               | Kroki                                                                                              | Oczekiwany rezultat                                   |
| ------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| FLASH-ACC-001 | Akceptacja fiszki bez edycji       | 1. Wygeneruj fiszki<br>2. Kliknij "Akceptuj" na jednej fiszce<br>3. Kliknij "Zapisz zaakceptowane" | Fiszka zapisana w DB z source="ai-full"               |
| FLASH-ACC-002 | Akceptacja fiszki z edycją         | 1. Edytuj front/back fiszki<br>2. Zaakceptuj<br>3. Zapisz                                          | Fiszka zapisana z source="ai-edited", zmieniona treść |
| FLASH-ACC-003 | Akceptacja wielu fiszek naraz      | 1. Zaakceptuj 5 fiszek<br>2. Kliknij "Zapisz wszystkie"                                            | 5 rekordów w DB, batch insert                         |
| FLASH-ACC-004 | Odrzucenie propozycji              | 1. Nie zaznaczaj checkboxa<br>2. Kliknij "Zapisz"                                                  | Fiszka NIE zostaje zapisana                           |
| FLASH-ACC-005 | Walidacja długości front (max 200) | 1. Edytuj front do 201 znaków<br>2. Próbuj zapisać                                                 | Błąd walidacji lub obcięcie do 200                    |
| FLASH-ACC-006 | Walidacja długości back (max 500)  | 1. Edytuj back do 501 znaków<br>2. Próbuj zapisać                                                  | Błąd walidacji lub obcięcie do 500                    |

#### 4.3.2 Tworzenie manualne

**Priorytet**: Średni  
**Przypadki testowe**:

| ID            | Opis                     | Kroki                                                              | Oczekiwany rezultat                               |
| ------------- | ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------- |
| FLASH-MAN-001 | Tworzenie fiszki od zera | 1. Kliknij "Dodaj fiszkę"<br>2. Wypełnij front i back<br>3. Zapisz | Fiszka w DB z source="manual", generation_id=null |
| FLASH-MAN-002 | Walidacja pustych pól    | 1. Pozostaw front lub back puste<br>2. Próbuj zapisać              | Błąd: "Pole wymagane"                             |

#### 4.3.3 Listing i zarządzanie

**Priorytet**: Wysoki  
**Przypadki testowe**:

| ID             | Opis                      | Kroki                                                        | Oczekiwany rezultat                                            |
| -------------- | ------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| FLASH-LIST-001 | Wyświetlanie listy fiszek | 1. Zaloguj się<br>2. Przejdź do listy fiszek                 | Lista wszystkich fiszek użytkownika, sorted by created_at DESC |
| FLASH-LIST-002 | Edycja istniejącej fiszki | 1. Kliknij "Edytuj" na fiszce<br>2. Zmień treść<br>3. Zapisz | Zmiany zapisane, updated_at zaktualizowane                     |
| FLASH-LIST-003 | Usuwanie fiszki           | 1. Kliknij "Usuń"<br>2. Potwierdź                            | Fiszka usunięta z DB                                           |
| FLASH-LIST-004 | Filtrowanie po source     | 1. Użyj filtra "Tylko AI"<br>2. Obserwuj listę               | Tylko fiszki z source="ai-full" lub "ai-edited"                |

### 4.4 Zarządzanie sesjami (Middleware)

#### 4.4.1 Session refresh

**Priorytet**: Krytyczny  
**Przypadki testowe**:

| ID       | Opis                             | Kroki                                                                                  | Oczekiwany rezultat                                |
| -------- | -------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| SESS-001 | Auto-refresh przed wygaśnięciem  | 1. Zaloguj się<br>2. Poczekaj do 5 min przed wygaśnięciem tokena<br>3. Wykonaj request | Token odświeżony automatycznie, nowe cookies       |
| SESS-002 | Redirect na login po wygaśnięciu | 1. Pozwól tokenowi wygasnąć<br>2. Próbuj dostać się na /generate                       | Redirect na /auth/login                            |
| SESS-003 | Cookies secure w production      | 1. Deploy na production<br>2. Sprawdź cookies                                          | Flagi: httpOnly=true, secure=true, sameSite=strict |

#### 4.4.2 Route protection

**Priorytet**: Krytyczny  
**Przypadki testowe**:

| ID        | Opis                                    | Kroki                                            | Oczekiwany rezultat                        |
| --------- | --------------------------------------- | ------------------------------------------------ | ------------------------------------------ |
| ROUTE-001 | Dostęp do /generate bez logowania       | 1. Wyloguj się<br>2. Próbuj wejść na /generate   | Redirect na /auth/login?returnTo=/generate |
| ROUTE-002 | Dostęp do /auth/login będąc zalogowanym | 1. Zaloguj się<br>2. Próbuj wejść na /auth/login | Redirect na /generate                      |

### 4.5 Bezpieczeństwo (RLS)

**Priorytet**: Krytyczny  
**Przypadki testowe**:

| ID          | Opis                                 | Kroki                                                                                       | Oczekiwany rezultat                  |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| SEC-RLS-001 | User A nie widzi fiszek User B       | 1. Zaloguj jako User A<br>2. Próbuj SELECT \* FROM flashcards WHERE user_id = userB         | Pusta lista (RLS blokuje)            |
| SEC-RLS-002 | Anonymous user nie może INSERT       | 1. Bez tokena auth<br>2. Próbuj INSERT flashcard                                            | Error 42501 (insufficient privilege) |
| SEC-RLS-003 | User A nie może UPDATE fiszek User B | 1. Zaloguj jako User A<br>2. Próbuj UPDATE flashcards SET ... WHERE id = userB_flashcard_id | Error (RLS blokuje)                  |
| SEC-RLS-004 | User A nie może DELETE fiszek User B | 1. Zaloguj jako User A<br>2. Próbuj DELETE FROM flashcards WHERE id = userB_flashcard_id    | Error (RLS blokuje)                  |
| SEC-RLS-005 | Generation_id validation             | 1. Użyj generation_id innego użytkownika<br>2. Próbuj stworzyć fiszkę                       | Error: "Invalid generation_id"       |

---

## 5. Środowisko testowe

### 5.1 Środowiska

- **Lokalne (Development)**: `localhost:4321`, Supabase Local Dev
- **Staging**: Kopia produkcji na DigitalOcean + Supabase staging project
- **Production**: DigitalOcean + Supabase production project

### 5.2 Dane testowe

- **Test users**: 5 użytkowników testowych z różnymi rolami i stanem danych
- **Test flashcards**: 100 fiszek z różnymi sources (ai-full, ai-edited, manual)
- **Test generations**: 20 rekordów generacji z różnymi modelami

### 5.3 Konfiguracja

```bash
# .env.test
SUPABASE_URL="http://localhost:54321"
SUPABASE_KEY="test-anon-key"
OPENROUTER_API_KEY="mock-key-for-tests"
NODE_ENV="test"
```

### 5.4 Mock Services

- **OpenRouter API**: Mock responses dla scenariuszy success/error
- **Email service**: Capture emails zamiast wysyłania
- **Time**: Możliwość symulacji upływu czasu (dla token expiry)

---

## 6. Narzędzia do testowania

### 6.1 Testy jednostkowe i integracyjne

- **Vitest** (v2.x): Framework testowy dla JavaScript/TypeScript
  - Konfiguracja: `vitest.config.ts`
  - Wsparcie dla ESM, TypeScript, mocking
  - Coverage: Istanbul/c8

### 6.2 Testy E2E

- **Playwright** (v1.x): Automatyzacja przeglądarek
  - Wsparcie: Chromium, Firefox, WebKit
  - Konfiguracja: `playwright.config.ts`
  - Headless mode dla CI/CD
  - Screenshots i videos na failure

### 6.3 Testy wydajnościowe

- **Lighthouse CI**: Audyty wydajności
- **Playwright Performance API**: Pomiary timing

### 6.4 Code Quality

- **ESLint**: Linting kodu
- **TypeScript Compiler**: Sprawdzanie typów
- **Prettier**: Formatowanie kodu

### 6.5 CI/CD

- **GitHub Actions**: Automatyczne uruchamianie testów
  - Na każdy push do `main`
  - Na każdy pull request
  - Nightly regression tests

### 6.6 Test Reporting

- **Vitest UI**: Interaktywny dashboard testów
- **Allure Reports**: Raporty HTML z historią
- **GitHub Actions Artifacts**: Zrzuty ekranu, logi

---

## 7. Harmonogram testów

### 7.1 Faza 1: Setup (Tydzień 1)

- [ ] Konfiguracja Vitest (vitest.config.ts)
- [ ] Konfiguracja Playwright (playwright.config.ts)
- [ ] Setup mock services (OpenRouter, Supabase)
- [ ] Przygotowanie danych testowych
- [ ] Konfiguracja CI/CD pipeline

### 7.2 Faza 2: Testy jednostkowe (Tydzień 2-3)

- [ ] Walidacja (validation.ts) - 20 testów
- [ ] Utils (utils.ts) - 10 testów
- [ ] Services logic - 30 testów
  - [ ] AuthService - 10 testów
  - [ ] GenerationService - 10 testów
  - [ ] FlashcardService - 10 testów
- [ ] React hooks - 10 testów
  - [ ] useGenerateFlashcards - 8 testów
  - [ ] useTheme - 2 testy

**Cel**: ≥80% code coverage

### 7.3 Faza 3: Testy integracyjne (Tydzień 4-5)

- [ ] API endpoints - 25 testów
  - [ ] /api/generations - 8 testów
  - [ ] /api/flashcards - 10 testów
  - [ ] /api/auth/\* - 7 testów
- [ ] Middleware - 8 testów
- [ ] Database operations - 15 testów
- [ ] OpenRouter integration - 6 testów

**Cel**: Wszystkie integracje działają poprawnie

### 7.4 Faza 4: Testy E2E (Tydzień 6)

- [ ] User journeys - 15 scenariuszy
  - [ ] Auth flows - 5 scenariuszy
  - [ ] Flashcard generation - 5 scenariuszy
  - [ ] Flashcard management - 5 scenariuszy
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

**Cel**: ≥95% critical paths covered

### 7.5 Faza 5: Testy bezpieczeństwa (Tydzień 7)

- [ ] RLS policies - 10 testów
- [ ] Input validation - 15 testów
- [ ] Session management - 8 testów
- [ ] OWASP Top 10 checks

**Cel**: Brak krytycznych luk bezpieczeństwa

### 7.6 Faza 6: Testy wydajnościowe (Tydzień 8)

- [ ] Lighthouse audits - wszystkie strony
- [ ] Load testing - API endpoints
- [ ] Database query optimization
- [ ] Monitoring setup

**Cel**: Wszystkie metryki w zakresach docelowych

### 7.7 Faza 7: UAT (Tydzień 9)

- [ ] Beta testing z 10 użytkownikami
- [ ] Zbieranie feedbacku
- [ ] Fixy bugów

**Cel**: Akceptacja przez stakeholderów

### 7.8 Faza 8: Pre-production (Tydzień 10)

- [ ] Regression testing (full suite)
- [ ] Performance monitoring setup
- [ ] Error tracking setup (Sentry?)
- [ ] Final security audit

**Cel**: Gotowość do wdrożenia

---

## 8. Kryteria akceptacji testów

### 8.1 Code Coverage

- **Minimum**: 80% line coverage
- **Target**: 90% line coverage
- **Critical paths**: 100% coverage

### 8.2 Test Pass Rate

- **Unit tests**: 100% pass
- **Integration tests**: 100% pass
- **E2E tests**: ≥95% pass
- **Security tests**: 100% pass

### 8.3 Performance Metrics

- **Lighthouse Score**: ≥90/100
- **TTFB**: <200ms
- **FCP**: <1.5s
- **LCP**: <2.5s
- **API response**: <500ms (bez AI)

### 8.4 Security

- **Brak luk krytycznych** (OWASP)
- **RLS policies**: 100% działające
- **XSS/SQLi**: 0 podatności

### 8.5 Business Metrics (post-launch)

- **AI acceptance rate**: ≥75%
- **Cards created via AI**: ≥75%
- **User retention**: Track weekly

### 8.6 Regression

- **Zero critical bugs** wprowadzonych przez nowe zmiany
- **Regression test suite**: Uruchomiony automatycznie przed każdym wdrożeniem

---

## 9. Role i odpowiedzialności w procesie testowania

### 9.1 Test Lead (1 osoba)

**Odpowiedzialności**:

- Koordynacja całego procesu testowania
- Review planu testów
- Raportowanie do stakeholderów
- Decyzje o go/no-go dla wdrożeń

### 9.2 QA Engineers (2 osoby)

**Odpowiedzialności**:

- Pisanie testów automatycznych (unit, integration)
- Wykonywanie testów manualnych
- Raportowanie bugów
- Weryfikacja fixów

### 9.3 Developers (wszyscy)

**Odpowiedzialności**:

- Pisanie unit testów dla swojego kodu
- Fixowanie bugów
- Code review z naciskiem na testowalność
- Utrzymanie >80% coverage

### 9.4 DevOps Engineer (1 osoba)

**Odpowiedzialności**:

- Setup CI/CD pipeline
- Konfiguracja środowisk testowych
- Monitoring i alerty
- Performance testing infrastructure

### 9.5 Product Owner

**Odpowiedzialności**:

- Akceptacja UAT
- Priorytetyzacja bugów
- Definiowanie kryteriów akceptacji

---

## 10. Procedury raportowania błędów

### 10.1 Klasyfikacja błędów

#### Severity Levels:

- **Critical (P0)**: Brak możliwości użycia core features (generowanie fiszek, logowanie)
  - **SLA**: Fix w ciągu 24h
  - **Deployment**: Hotfix na production natychmiast
- **High (P1)**: Poważne problemy wpływające na użyteczność
  - **SLA**: Fix w ciągu 3 dni
  - **Deployment**: Z najbliższym release
- **Medium (P2)**: Problemy wpływające na UX, ale nie blokujące
  - **SLA**: Fix w ciągu 2 tygodni
  - **Deployment**: Zaplanowany release
- **Low (P3)**: Kosmetyczne, małe ulepszenia
  - **SLA**: Backlog, priorytetyzacja według potrzeb

### 10.2 Bug Report Template

```markdown
## Bug ID: BUG-XXXX

**Tytuł**: [Krótki, opisowy tytuł]
**Severity**: [Critical/High/Medium/Low]
**Priority**: [P0/P1/P2/P3]
**Status**: [New/In Progress/Testing/Closed]
**Environment**: [Local/Staging/Production]

### Opis

[Szczegółowy opis problemu]

### Kroki reprodukcji

1.
2.
3.

### Oczekiwane zachowanie

[Co powinno się stać]

### Aktualne zachowanie

[Co faktycznie się dzieje]

### Screenshots/Videos

[Załączniki]

### Environment Details

- Browser: [Chrome 120, Firefox 121, etc.]
- OS: [Windows 11, macOS 14, etc.]
- User ID: [jeśli aplikuje]

### Logi/Stack Trace
```

[Logi z konsoli/serwera]

```

### Assigned To
[Developer name]

### Related Tests
[Link do testów które złapały błąd]
```

### 10.3 Kanały raportowania

- **GitHub Issues**: Główny system trackingu
- **Slack #bugs**: Natychmiastowe alerty dla P0
- **Weekly Bug Review**: Spotkanie zespołu co tydzień
- **Production Monitoring**: Sentry/LogRocket dla błędów runtime

### 10.4 Workflow

1. **Discovery**: Tester/User znajduje błąd
2. **Report**: Utworzenie GitHub Issue według template
3. **Triage**: Test Lead klasyfikuje Severity/Priority
4. **Assignment**: Przydzielenie do developera
5. **Fix**: Developer implementuje poprawkę
6. **Review**: Code review + testy
7. **Verification**: Tester weryfikuje fix
8. **Deployment**: Wdrożenie według SLA
9. **Regression Test**: Automatyczny test dla tego błędu
10. **Close**: Zamknięcie issue

### 10.5 Metryki

Śledzone KPI:

- **Bug Discovery Rate**: Liczba bugów znalezionych per tydzień
- **Bug Fix Rate**: Liczba bugów naprawionych per tydzień
- **Open Bug Count**: Liczba otwartych bugów
- **Mean Time to Resolution (MTTR)**: Średni czas naprawy per severity
- **Bug Reopen Rate**: % bugów ponownie otwartych (target: <5%)
- **Escaped Bugs**: Bugi wykryte na production (target: <10% wszystkich)

---

## 11. Struktura katalogów testowych

```
10x-cards/
├── tests/
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── validation.test.ts
│   │   │   ├── utils.test.ts
│   │   │   ├── auth.service.test.ts
│   │   │   ├── generation.service.test.ts
│   │   │   └── flashcard.service.test.ts
│   │   ├── components/
│   │   │   ├── hooks/
│   │   │   │   ├── useGenerateFlashcards.test.tsx
│   │   │   │   └── useTheme.test.tsx
│   │   │   └── ui/
│   │   │       ├── button.test.tsx
│   │   │       └── input.test.tsx
│   │   └── middleware/
│   │       └── index.test.ts
│   │
│   ├── integration/
│   │   ├── api/
│   │   │   ├── generations.test.ts
│   │   │   ├── flashcards.test.ts
│   │   │   └── auth/
│   │   │       ├── login.test.ts
│   │   │       ├── register.test.ts
│   │   │       └── reset-password.test.ts
│   │   ├── database/
│   │   │   ├── rls-policies.test.ts
│   │   │   ├── migrations.test.ts
│   │   │   └── triggers.test.ts
│   │   └── external/
│   │       ├── openrouter.test.ts
│   │       └── supabase-auth.test.ts
│   │
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── register.spec.ts
│   │   │   ├── login.spec.ts
│   │   │   └── password-reset.spec.ts
│   │   ├── flashcards/
│   │   │   ├── generate.spec.ts
│   │   │   ├── manage.spec.ts
│   │   │   └── accept-proposals.spec.ts
│   │   └── navigation/
│   │       └── protected-routes.spec.ts
│   │
│   ├── security/
│   │   ├── rls.test.ts
│   │   ├── xss.test.ts
│   │   ├── sql-injection.test.ts
│   │   └── session-security.test.ts
│   │
│   ├── performance/
│   │   ├── lighthouse.test.ts
│   │   ├── api-benchmarks.test.ts
│   │   └── database-queries.test.ts
│   │
│   ├── fixtures/
│   │   ├── users.json
│   │   ├── flashcards.json
│   │   └── generations.json
│   │
│   ├── mocks/
│   │   ├── openrouter.mock.ts
│   │   ├── supabase.mock.ts
│   │   └── email.mock.ts
│   │
│   └── helpers/
│       ├── test-setup.ts
│       ├── db-helpers.ts
│       └── auth-helpers.ts
│
├── vitest.config.ts
├── playwright.config.ts
└── .github/
    └── workflows/
        ├── unit-tests.yml
        ├── integration-tests.yml
        ├── e2e-tests.yml
        └── nightly-regression.yml
```

---

## 12. Przykładowe konfiguracje

### 12.1 vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/helpers/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}", "src/types.ts", "src/db/database.types.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 12.2 playwright.config.ts

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 12.3 GitHub Actions Workflow

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22.14.0"
      - run: npm ci
      - run: npm run test:unit
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22.14.0"
      - run: npm ci
      - run: npx supabase start
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22.14.0"
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 13. Podsumowanie

Niniejszy plan testów dla aplikacji **10x-cards** zapewnia kompleksowe pokrycie wszystkich krytycznych aspektów systemu, ze szczególnym naciskiem na:

### Kluczowe obszary:

1. **Bezpieczeństwo**: RLS policies, walidacja danych, zarządzanie sesjami
2. **Core functionality**: Generowanie fiszek przez AI, akceptacja i edycja propozycji
3. **Integracje**: OpenRouter API, Supabase Auth, PostgreSQL
4. **Wydajność**: Metryki Web Vitals, responsywność API
5. **Użyteczność**: E2E user journeys, cross-browser compatibility

### Metryki sukcesu:

- ✅ 80%+ code coverage
- ✅ 100% critical path coverage
- ✅ 0 krytycznych luk bezpieczeństwa
- ✅ ≥90 Lighthouse score
- ✅ ≥75% AI acceptance rate (business metric)

### Timeline:

- **10 tygodni** od setupu do wdrożenia
- **Automatyzacja**: CI/CD z testami na każdy commit
- **Continuous monitoring**: Post-launch tracking metryk

### Narzędzia:

- **Vitest**: Unit + Integration tests
- **Playwright**: E2E tests
- **GitHub Actions**: CI/CD automation
- **Manual UAT**: Final validation

### Odpowiedzialności:

- **Test Lead**: Koordynacja i raportowanie
- **QA Engineers**: Automatyzacja i manualne testy
- **Developers**: Unit testy i fixing
- **DevOps**: Infrastruktura testowa

Plan ten zapewnia solidną podstawę dla zapewnienia jakości aplikacji 10x-cards i minimalizuje ryzyko błędów na produkcji. Regularne review i aktualizacje planu są kluczowe wraz z ewolucją produktu.

---

**Data utworzenia**: 2024-10-17  
**Wersja**: 1.0  
**Autor**: AI QA Engineer  
**Status**: Draft - Do zatwierdzenia przez zespół
