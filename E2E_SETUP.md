# Instrukcja uruchomienia testów E2E

## Krok 1: Instalacja zależności

Musisz zainstalować bibliotekę `dotenv`:

```bash
npm install dotenv --save-dev
```

Następnie zainstaluj przeglądarki Playwright (jeśli jeszcze tego nie zrobiłeś):

```bash
npx playwright install
```

## Krok 2: Konfiguracja pliku .env.test

1. Skopiuj plik `.env.test.example` jako `.env.test`:
   ```bash
   copy .env.test.example .env.test
   ```

2. Wypełnij wartości w pliku `.env.test`:
   - `E2E_USERNAME` - email użytkownika testowego
   - `E2E_PASSWORD` - hasło użytkownika testowego
   - `PUBLIC_SUPABASE_URL` - URL twojego projektu Supabase (testowego lub dev)
   - `PUBLIC_SUPABASE_ANON_KEY` - klucz publiczny Supabase

## Krok 3: Przygotowanie użytkownika testowego

Musisz stworzyć użytkownika testowego w bazie danych:

1. Przejdź do Supabase Dashboard
2. Otwórz Authentication → Users
3. Dodaj nowego użytkownika z emailem i hasłem z `.env.test`
4. Opcjonalnie: potwierdź email użytkownika

## Krok 4: Uruchomienie aplikacji w trybie testowym

Przed uruchomieniem testów, uruchom aplikację:

```bash
npm run dev:e2e
```

Aplikacja powinna działać na `http://localhost:4321`

## Krok 5: Uruchomienie testów E2E

W nowym terminalu uruchom testy:

```bash
# Uruchom wszystkie testy
npm run e2e

# Uruchom testy w trybie UI (interaktywny)
npm run e2e:ui

# Uruchom konkretny test
npm run e2e -- flashcard-generation.spec.ts

# Zobacz raport z testów
npm run e2e:report
```

## Co zostało zaimplementowane?

### Selektory testowe (data-testid)

Dodałem selektory `data-testid` do następujących komponentów:

**LoginForm:**
- `login-form` - główny kontener formularza
- `login-email-input` - pole email
- `login-password-input` - pole hasła
- `login-submit-button` - przycisk logowania

**Strona generowania:**
- `text-input-area` - obszar wprowadzania tekstu
- `source-text-textarea` - textarea z tekstem źródłowym
- `generate-button` - przycisk generowania
- `skeleton-loader` - loader podczas generowania
- `flashcard-list` - lista fiszek
- `flashcard-item` - pojedyncza fiszka
- `flashcard-accept-button` - przycisk akceptacji fiszki
- `flashcard-edit-button` - przycisk edycji fiszki
- `flashcard-reject-button` - przycisk odrzucenia fiszki
- `bulk-save-section` - sekcja zapisywania
- `save-accepted-button` - zapis zaakceptowanych
- `save-all-button` - zapis wszystkich

### Page Object Models (POM)

**LoginPage (`e2e/tests/pages/LoginPage.ts`):**
- `goto()` - przejście do strony logowania
- `assertOnPage()` - weryfikacja czy jesteśmy na stronie
- `login(email, password)` - logowanie użytkownika

**GeneratePage (`e2e/tests/pages/GeneratePage.ts`):**
- `goto()` - przejście do strony generowania
- `assertOnPage()` - weryfikacja czy jesteśmy na stronie
- `fillSourceText(text)` - wypełnienie pola tekstem
- `clickGenerate()` - kliknięcie przycisku generowania
- `waitForFlashcardsToLoad()` - oczekiwanie na załadowanie fiszek
- `getFlashcardCount()` - pobranie liczby fiszek
- `acceptFlashcard(index)` - akceptacja fiszki
- `acceptAllFlashcards()` - akceptacja wszystkich fiszek
- `rejectFlashcard(index)` - odrzucenie fiszki
- `editFlashcard(index, front, back)` - edycja fiszki
- `clickSaveAccepted()` - zapis zaakceptowanych
- `clickSaveAll()` - zapis wszystkich
- `waitForSaveSuccess()` - oczekiwanie na komunikat sukcesu

### Testy E2E (`e2e/tests/flashcard-generation.spec.ts`)

**Test 1: "should generate flashcards from source text"**
- Logowanie użytkownika
- Wypełnienie pola tekstem źródłowym (1000+ znaków)
- Kliknięcie przycisku generowania
- Weryfikacja pojawienia się loadera
- Weryfikacja wygenerowania fiszek
- Weryfikacja widoczności sekcji zapisywania

**Test 2: "should accept flashcards and save them"**
- Generowanie fiszek
- Akceptacja wybranych fiszek
- Zapis zaakceptowanych fiszek
- Weryfikacja komunikatu sukcesu
- Weryfikacja wyczyszczenia listy po zapisie

**Test 3: "should reject unwanted flashcards"**
- Generowanie fiszek
- Odrzucenie fiszki
- Weryfikacja zmniejszenia liczby fiszek

**Test 4: "should disable generate button with insufficient text"**
- Wprowadzenie krótkiego tekstu (< 1000 znaków)
- Weryfikacja że przycisk generowania jest wyłączony

## Struktura plików testowych

```
e2e/
├── playwright.config.ts        # Konfiguracja Playwright z dotenv
├── tests/
│   ├── example.spec.ts         # Przykładowy test (istniejący)
│   ├── flashcard-generation.spec.ts  # Nowy test E2E
│   └── pages/
│       ├── LoginPage.ts        # POM dla strony logowania
│       └── GeneratePage.ts     # POM dla strony generowania
```

## Dobre praktyki zastosowane w testach

1. **Selektory wewnątrz komponentów** - zgodnie z kursem, selektory `data-testid` są dodane bezpośrednio w komponentach, nie na zewnątrz

2. **Page Object Model** - oddzielenie logiki testów od operacji na stronie, co ułatwia utrzymanie

3. **Reużywalność** - metody POM mogą być używane w wielu testach

4. **Oczekiwania (assertions)** - każdy test weryfikuje konkretne zachowania

5. **beforeEach** - logowanie wykonywane przed każdym testem, aby testy były niezależne

6. **Timeouty** - odpowiednie timeouty dla operacji asynchronicznych (generowanie może trwać do 30s)

## Opcjonalne optymalizacje (na przyszłość)

Zgodnie z kursem, możesz rozważyć:

1. **Optymalizacja logowania** - użycie sesji zapisanej do pliku lub logowania przez API
2. **Teardown** - czyszczenie danych testowych po wykonaniu testów
3. **Wielokrotni użytkownicy** - dla pracy zespołowej

## Troubleshooting

**Problem: Testy się nie uruchamiają**
- Sprawdź czy aplikacja działa na http://localhost:4321
- Sprawdź czy plik .env.test istnieje i ma poprawne wartości
- Sprawdź czy dotenv jest zainstalowany

**Problem: Test logowania failuje**
- Sprawdź czy użytkownik testowy istnieje w bazie
- Sprawdź czy email jest potwierdzony
- Sprawdź dane w .env.test

**Problem: Timeout podczas generowania**
- Sprawdź czy masz dostęp do OpenRouter API
- Sprawdź czy klucz API jest poprawny
- Zwiększ timeout w teście jeśli potrzeba

## Gratulacje! 🎉

Udało Ci się zaimplementować kompleksowe testy E2E dla aplikacji 10x-cards!


