# Specyfikacja Architektury Modułu Autentykacji – 10x-cards

## Wstęp

Niniejsza specyfikacja opisuje architekturę modułu autentykacji dla aplikacji 10x-cards. Moduł obejmuje funkcjonalności rejestracji, logowania, wylogowania oraz odzyskiwania hasła, zgodnie z wymaganiami US-001 i US-002 z PRD.

Rozwiązanie integruje **Supabase Auth** z frameworkiem **Astro** oraz komponentami **React**, zachowując istnęjące funkcjonalności aplikacji oraz utrzymując spójność z technologią serii.

---

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Koncepcja stanów aplikacji

Aplikacja będzie operować dwoma głównymi stanami użytkownika:

#### Stan 1: Użytkownik anonimowy

- Dostęp tylko do publicznych stron: logowania, rejestracji, resetu hasła
- Brak dostępu do stron chroniony: `/generate`, `/my-flashcards`
- Automatyczne przekierowanie na `/auth/login` przy próbie dostępu do tras chronionych

#### Stan 2: Użytkownik zalogowany

- Pełny dostęp do funkcjonalności aplikacji
- Sesja przechowywana w secure cookie
- Token JWT dostępny w `context.locals` dla walidacji na serwerze
- Możliwość wylogowania i powrotu do stanu anonimowego

### 1.2 Struktura tras (routing)

#### Nowe strony autentykacji:

- `GET /auth/login` – Strona logowania
- `GET /auth/register` – Strona rejestracji
- `GET /auth/forgot-password` – Strona początkowa resetu hasła
- `GET /auth/reset-password` – Strona resetowania hasła (zawiera token w URL)
- `POST /api/auth/login` – Endpoint logowania
- `POST /api/auth/register` – Endpoint rejestracji
- `POST /api/auth/logout` – Endpoint wylogowania
- `POST /api/auth/forgot-password` – Endpoint żądania resetu hasła
- `POST /api/auth/reset-password` – Endpoint resetowania hasła

#### Istniejące strony (wymagające zmian):

- `GET /` – Będzie pełnić rolę landing page lub przekierowania na `/generate` dla zalogowanych
- `GET /generate` – Wymaga autentykacji (chroniona)
- `GET /my-flashcards` – Nowa strona, wymaga autentykacji (chroniona)

#### Strony bez zmian:

- `GET /kitchen-sink` – Pozostaje bez zmian (demo komponentów)

### 1.3 Komponenty UI – warstwa frontend (React)

#### 1.3.1 Formularz logowania (`LoginForm.tsx`)

- Typ: Komponent React (client-side)
- Lokalizacja: `src/components/LoginForm.tsx`
- Odpowiedzialność: Obsługa logiki logowania po stronie klienta

**Elementy formularza:**

- Pole email (walidacja RFC 5322)
- Pole hasła
- Checkbox "Zapamiętaj mnie" (opcjonalnie)
- Przycisk logowania
- Link do rejestracji
- Link do resetowania hasła

**Walidacja kliencka:**

- Email: nie pusty, prawidłowy format
- Hasło: nie puste, minimum 6 znaków
- Wyświetlanie komunikatów błędów w real-time

**Obsługa zdarzeń:**

- Submit formularza → wysłanie POST do `/api/auth/login`
- Obsługa błędów: nieprawidłowe dane logowania, błąd serwera
- Po sukcesie: redirect do `/generate` z opóźnieniem dla UX
- Loader/spinner podczas wysyłania

**Komunikaty błędów:**

- "Adres email jest wymagany"
- "Hasło jest wymagane"
- "Nieprawidłowe dane logowania"
- "Konto nie istnieje"
- "Błąd serwera – spróbuj ponownie"

#### 1.3.2 Formularz rejestracji (`RegisterForm.tsx`)

- Typ: Komponent React (client-side)
- Lokalizacja: `src/components/RegisterForm.tsx`
- Odpowiedzialność: Obsługa logiki rejestracji po stronie klienta

**Elementy formularza:**

- Pole email (walidacja RFC 5322)
- Pole hasła (z wymogami siły hasła)
- Pole potwierdzenia hasła
- Checkbox akceptacji regulaminu (przyszłościowy)
- Przycisk rejestracji
- Link do logowania

**Walidacja kliencka:**

- Email: nie pusty, prawidłowy format, kontrola dostępności
- Hasło: minimum 8 znaków, conajmniej 1 wielka litera, 1 cyfra, 1 znak specjalny
- Potwierdzenie: musi być identyczne z hasłem
- Wyświetlanie rzeczywistego feedbacku dotyczącego siły hasła

**Obsługa zdarzeń:**

- Submit formularza → wysłanie POST do `/api/auth/register`
- Obsługa błędów: email już istnieje, słabe hasło, błąd serwera
- Po sukcesie: automatyczne logowanie i redirect do `/generate`
- Loader/spinner podczas wysyłania

**Komunikaty błędów:**

- "Adres email jest wymagany"
- "Hasło jest wymagane"
- "Hasła nie są identyczne"
- "Hasło musi zawierać co najmniej 8 znaków, wielką literę, cyfrę i znak specjalny"
- "Konto z tym adresem email już istnieje"
- "Błąd serwera – spróbuj ponownie"

#### 1.3.3 Formularz zapomniania hasła (`ForgotPasswordForm.tsx`)

- Typ: Komponent React (client-side)
- Lokalizacja: `src/components/ForgotPasswordForm.tsx`
- Odpowiedzialność: Obsługa żądania resetu hasła

**Elementy:**

- Pole email
- Przycisk wysłania linku resetowania
- Link powrotu do logowania

**Walidacja kliencka:**

- Email: nie pusty, prawidłowy format

**Obsługa zdarzeń:**

- Submit → wysłanie POST do `/api/auth/forgot-password`
- Po sukcesie: wyświetlenie komunikatu potwierdzenia
- Komunikat: "Link resetowania hasła został wysłany na Twój adres email"

**Komunikaty błędów:**

- "Adres email nie istnieje"
- "Błąd serwera – spróbuj ponownie"

#### 1.3.4 Formularz resetowania hasła (`ResetPasswordForm.tsx`)

- Typ: Komponent React (client-side)
- Lokalizacja: `src/components/ResetPasswordForm.tsx`
- Odpowiedzialność: Obsługa resetowania hasła za pomocą tokenu

**Elementy:**

- Pole nowego hasła
- Pole potwierdzenia hasła
- Przycisk resetowania
- Informacja o tokenie w URL

**Walidacja kliencka:**

- Hasło: minimum 8 znaków, wymagania siły
- Potwierdzenie: identyczne z hasłem

**Obsługa zdarzeń:**

- Weryfikacja tokenu z URL na załadowaniu strony
- Submit → wysłanie POST do `/api/auth/reset-password` z tokenem
- Po sukcesie: redirect do `/auth/login` z komunikatem
- Komunikat: "Hasło zostało zmienione. Zaloguj się nowym hasłem"

**Komunikaty błędów:**

- "Token resetowania jest nieprawidłowy lub wygasł"
- "Hasła nie są identyczne"
- "Błąd serwera – spróbuj ponownie"

#### 1.3.5 Komponenty wspólne

**NavBar / Header (`AuthHeader.tsx`)**

- Typ: Komponent React lub Astro
- Lokalizacja: `src/components/AuthHeader.tsx`
- Odpowiedzialność: Nawigacja i informacje o zalogowanym użytkowniku

**Elementy dla zalogowanych:**

- Wyświetlanie emailu użytkownika
- Avatar z inicjałami
- Menu dropdown z opcjami:
  - Profil (przyszłościowe)
  - Ustawienia (przyszłościowe)
  - Wylogowanie
- Toggle motywu (istniejący komponent `ThemeToggle`)

**Elementy dla anonimowych:**

- Przycisk "Zaloguj się"
- Przycisk "Rejestracja"
- Toggle motywu

**Komponenty błędów (`ErrorNotification.tsx`)**

- Już istnieje w projekcie
- Będzie wykorzystywany do wyświetlania błędów autentykacji
- Komunikaty będą dostarczane z formularzy

### 1.4 Strony Astro – warstwa layout i routing

#### 1.4.1 Layout aplikacji (`Layout.astro`)

- Modyfikacja istniejącego pliku
- Dodanie warunkowego renderowania nawigacji w zależności od stanu autentykacji
- Uwzględnienie informacji o sesji z `context.locals`
- Dodanie meta tagów dla bezpieczeństwa (CSP headers, itp.)

```
Pseudo-struktura zmian:
- Wczytanie informacji o sesji z context.locals.session
- Przekazanie statusu autentykacji do komponentów React
- Layout strony:
  * Header z nawigacją
  * Main slot dla zawartości
  * Footer (przyszłościowe)
```

#### 1.4.2 Strona logowania (`src/pages/auth/login.astro`)

- Nowa strona
- Struktura:
  - Layout (bez pełnego headera, minimalistyczne)
  - Formularz LoginForm (React, client:load)
  - Link do rejestracji
  - Link "Nie pamiętasz hasła?"
- Redirect automatyczny na `/generate` dla zalogowanych użytkowników

#### 1.4.3 Strona rejestracji (`src/pages/auth/register.astro`)

- Nowa strona
- Struktura:
  - Layout (bez pełnego headera, minimalistyczne)
  - Formularz RegisterForm (React, client:load)
  - Link do logowania
- Redirect automatyczny na `/generate` dla zalogowanych użytkowników

#### 1.4.4 Strona resetu hasła (`src/pages/auth/forgot-password.astro`)

- Nowa strona
- Struktura:
  - Formularz ForgotPasswordForm (React, client:load)
  - Link powrotu do logowania

#### 1.4.5 Strona resetowania hasła (`src/pages/auth/reset-password.astro`)

- Nowa strona
- Token pobierany z parametru URL: `/auth/reset-password?token=xxx`
- Struktura:
  - Formularz ResetPasswordForm (React, client:load) z tokenem
  - Obsługa przypadku wygaśniętego tokenu

#### 1.4.6 Chronione strony

- `src/pages/generate.astro` – zmiana (dodanie sprawdzenia sesji)
- Nowa strona: `src/pages/my-flashcards.astro` (przyszłościowo)

### 1.5 Middleware – sprawdzanie autentykacji (`src/middleware/index.ts`)

Modyfikacja istniejącego middleware'u:

**Odpowiedzialności:**

- Wczytanie sesji z Supabase Auth
- Umieszczenie informacji o sesji w `context.locals.session`
- Umieszczenie Supabase client w `context.locals.supabase` (istniejące)
- Logika ochrony tras (redirect anonimowych użytkowników z tras chronionych)
- Sprawdzenie świeżości tokenu JWT i refresh jeśli potrzebny

**Zachowanie middleware'u:**

- Dla publicznych tras (`/`, `/auth/*`): brak dodatkowej logiki
- Dla chronionych tras (`/generate`):
  - Sprawdzenie sesji
  - Jeśli brak sesji: redirect do `/auth/login` z `returnTo` query param
  - Jeśli istnieje sesja: kontynuacja
- Umieszczenie użytkownika w `context.locals.user` dla użycia w API routach

---

## 2. LOGIKA BACKENDOWA

### 2.1 Endpointy API autentykacji

#### 2.1.1 POST `/api/auth/register`

- Odpowiedzialność: Rejestracja nowego użytkownika
- Request body (Zod schema):
  ```
  {
    email: string (RFC 5322),
    password: string (min 8 znaków, wymogi siły),
    confirmPassword: string
  }
  ```
- Logika:
  1. Walidacja danych wejściowych
  2. Normalizacja emailu (lowercase, trim)
  3. Sprawdzenie czy email już istnieje w bazie
  4. Jeśli istnieje: return 409 Conflict
  5. Hasło: weryfikacja wymogów siły
  6. Rejestracja w Supabase Auth (email/password provider)
  7. Tworzenie wpisu użytkownika w tabeli `users` w Supabase (przyszłościowe)
  8. Automatyczne logowanie użytkownika
  9. Ustawienie secure cookie z sesją
  10. Return tokenu sesji

- Response (sukces 201):

  ```
  {
    session: {
      access_token: string,
      refresh_token: string,
      user: {
        id: string,
        email: string
      }
    }
  }
  ```

- Error responses:
  - 400: Invalid input (validation errors)
  - 409: Email already exists
  - 500: Server error

#### 2.1.2 POST `/api/auth/login`

- Odpowiedzialność: Logowanie użytkownika
- Request body (Zod schema):
  ```
  {
    email: string,
    password: string,
    rememberMe?: boolean
  }
  ```
- Logika:
  1. Walidacja danych wejściowych
  2. Normalizacja emailu
  3. Autoryzacja przez Supabase Auth (signInWithPassword)
  4. Jeśli nieprawidłowe dane: return 401 Unauthorized
  5. Ustawienie secure cookie z sesją
  6. Jeśli `rememberMe`: cookie expires za 30 dni (bez tego: session cookie)
  7. Return tokenu sesji

- Response (sukces 200):

  ```
  {
    session: {
      access_token: string,
      refresh_token: string,
      user: {
        id: string,
        email: string
      }
    }
  }
  ```

- Error responses:
  - 400: Invalid input
  - 401: Invalid credentials
  - 500: Server error

#### 2.1.3 POST `/api/auth/logout`

- Odpowiedzialność: Wylogowanie użytkownika
- Request body: empty lub zawiera sesję
- Logika:
  1. Pobranie sesji z cookie lub context.locals
  2. Anulowanie sesji w Supabase Auth (signOut)
  3. Usunięcie cookie sesji
  4. Return 200 OK

- Response (sukces 200):
  ```
  {
    success: true
  }
  ```

#### 2.1.4 POST `/api/auth/forgot-password`

- Odpowiedzialność: Wysłanie linku resetowania hasła
- Request body:
  ```
  {
    email: string
  }
  ```
- Logika:
  1. Walidacja emailu
  2. Sprawdzenie czy użytkownik istnieje
  3. Wygenerowanie tokenu resetowania przez Supabase Auth (resetPasswordForEmail)
  4. Supabase automatycznie wysyła email z linkiem resetowania
  5. Return 200 OK (bez ujawniania czy email istnieje – bezpieczeństwo)

- Response (sukces 200):
  ```
  {
    success: true,
    message: "Check your email for password reset link"
  }
  ```

#### 2.1.5 POST `/api/auth/reset-password`

- Odpowiedzialność: Resetowanie hasła za pomocą tokenu
- Request body:
  ```
  {
    token: string,
    password: string,
    confirmPassword: string
  }
  ```
- Logika:
  1. Walidacja danych
  2. Weryfikacja tokenu
  3. Jeśli token wygasł: return 401 Unauthorized
  4. Zmiana hasła w Supabase Auth (updateUser z nowym hasłem)
  5. Opcjonalnie: automatyczne logowanie użytkownika
  6. Return 200 OK

- Response (sukces 200):

  ```
  {
    success: true
  }
  ```

- Error responses:
  - 400: Invalid input
  - 401: Token expired or invalid
  - 500: Server error

### 2.2 Walidacja danych

Implementacja w pliku `src/lib/validation.ts` (rozszerzenie istniejącego):

**Schematy Zod:**

- `emailSchema`: RFC 5322 format
- `passwordSchema`: minimum 8 znaków, wymogi siły (uppercase, number, special char)
- `registerSchema`: email, password, confirmPassword
- `loginSchema`: email, password
- `resetPasswordSchema`: token, password, confirmPassword
- `forgotPasswordSchema`: email

### 2.3 Serwis autentykacji (`src/lib/auth.service.ts`)

Nowy serwis do obsługi logiki autentykacji:

**Metody:**

- `register(email, password): Promise<AuthResponse>`
- `login(email, password): Promise<AuthResponse>`
- `logout(session): Promise<void>`
- `forgotPassword(email): Promise<void>`
- `resetPassword(token, newPassword): Promise<void>`
- `validateToken(token): Promise<User | null>`
- `refreshSession(refreshToken): Promise<AuthResponse>`
- `getCurrentUser(supabase): Promise<User | null>`

### 2.4 Obsługa błędów

**Hierarchia błędów:**

- `AuthenticationError`: Nieprawidłowe dane logowania
- `AuthorizationError`: Brak uprawnień
- `TokenExpiredError`: Token wygasł
- `ValidationError`: Dane nie przeszły walidację
- `ServerError`: Błąd po stronie serwera

**Logowanie:**

- Wszystkie błędy krytyczne logowane w konsoli serwera
- Komunikaty dla użytkownika przetłumaczone na polski, ogólnikowe (bez ujawniania szczegółów technicznych)

### 2.5 Obsługa ciasteczek (Cookies)

**Cookie `session`:**

- Secure: true
- HttpOnly: true
- SameSite: Strict
- Path: /
- Domain: automatyczne
- Expires:
  - Bez "remember me": session (brak expiry)
  - Z "remember me": 30 dni

**Ustawienie w kodzie Astro:**

```
Astro.cookies.set('session', sessionToken, {
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: 'strict',
  maxAge: rememberMe ? 30 * 24 * 60 * 60 : undefined
})
```

### 2.6 CORS i bezpieczeństwo

- CORS headers dla endpointów API (opcjonalnie, w zależności od konfiguracji)
- Rate limiting na endpunktach autentykacji (3 próby na minutę)
- Zapobieganie CSRF (tokeny w cookie automatycznie sprawdzane przez Supabase)
- Content Security Policy (CSP) headers w Layout.astro

---

## 3. SYSTEM AUTENTYKACJI – INTEGRACJA SUPABASE

### 3.1 Konfiguracja Supabase Auth

**Provider:** Email/Password (built-in)

**Ustawienia (w konsoli Supabase):**

- Enable Email Provider: true
- Email Templates: (Standard, personalizacja przyszłościowa)
- Auth Redirect URLs:
  - `http://localhost:3000/auth/reset-password` (dev)
  - `https://10xcards.app/auth/reset-password` (prod)
- Password Requirements: Minimum 6 znaków (validation po stronie klienta: 8)

### 3.2 Integracja z Astro

**Inicjalizacja klienta Supabase:**

- Rozszerzenie istniejącego pliku `src/db/supabase.client.ts`
- Export dodatkowych funkcji autentykacji

**Nowy plik:** `src/lib/supabase.auth.ts`

- Wrapper funkcji Supabase Auth dla łatwości użytku
- Obsługa sesji i tokenów
- Synchronizacja z Supabase Auth state

### 3.3 Zarządzanie sesją

**Session storage:**

- Sesja przechowywana w secure HttpOnly cookie
- Dodatkowo: localStorage dla informacji o zalogowanym użytkowniku (email, avatar placeholder)

**Aktualizacja sesji:**

- Automatyczne odświeżanie tokenu przed wygaśnięciem
- Middleware sprawdza świeżość tokenu przy każdym requestzie
- Jeśli refresh token wygasł: logout automatycznie

**Logout:**

- Usunięcie cookie
- Czyszczenie localStorage
- Redirect na `/auth/login`

### 3.4 Bezpieczeństwo

**Ogólne zasady:**

- Brak przechowywania hasła na kliencie
- Brak ujawniania detali błędów autentykacji (np. "email nie istnieje")
- Komunikaty błędów ogólne ("Nieprawidłowe dane logowania")
- HTTPS tylko (secure cookies)
- JWT token w Supabase: RS256 algorithm (default)

**Ochrona przed atakami:**

- CSRF: automatycznie przez Supabase
- XSS: HttpOnly cookies, sanitization komunikatów
- Brute force: Rate limiting na endpunktach
- Session hijacking: Secure + HttpOnly + SameSite cookies

### 3.5 Tabela użytkowników (przyszłościowo)

**Przyszła tabela `users`:**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY (foreign key -> auth.users.id),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Użycie:**

- Przechowywanie dodatkowych metadanych użytkownika
- Dla MVP wystarczy Supabase auth.users

---

## 4. INTEGRACJA Z ISTNIEJĄCĄ APLIKACJĄ

### 4.1 Zmian w API do generowania fiszek

**Istniejący endpoint:** `POST /api/generations`

- Aktualnie: brak wymuszenia autentykacji
- **Zmiana:** Dodanie sprawdzenia sesji w middleware
- **Extrahowanie user_id z sesji:** `context.locals.user.id`
- **Zapis user_id w tabeli `generations`**

**Zmiana w strukturze danych:**

- Kolumna `user_id` w tabeli `generations` (foreign key)
- Kolumna `user_id` w tabeli `flashcards` (foreign key)

### 4.2 Izolacja danych użytkownika

- Każdy endpoint API będzie sprawdzać czy użytkownik ma dostęp do zasobu
- Row Level Security (RLS) w Supabase (przyszłościowo)
- Query do `flashcards` będzie filtrować po `user_id = context.locals.user.id`

### 4.3 Strona główna (`/`)

**Logika:**

- Jeśli zalogowany: redirect na `/generate`
- Jeśli anonimowy: wyświetlenie landing page lub redirect na `/auth/login`
- Można alternatywnie wyświetlić welcome screen dla anonimowych

### 4.4 Usunięcie fikcyjnego użytkownika

- Zmienna `DEFAULT_USER_ID` w `src/db/supabase.client.ts` będzie usunięta
- Zamiast tego: `context.locals.user.id` z sesji

---

## 5. PRZEPŁYW UŻYTKOWNIKA – SCENARIUSZE

### 5.1 Scenariusz 1: Nowy użytkownik – Rejestracja

1. Użytkownik wchodzi na `/`
2. System: anonimowy → redirect na `/auth/login`
3. Użytkownik klika "Nie masz konta? Zarejestruj się"
4. Strona: `/auth/register`
5. Formularz: email, hasło, potwierdzenie
6. Submit → POST `/api/auth/register`
7. Serwer: walidacja, rejestracja w Supabase, automatyczne logowanie
8. Cookie: ustawienie `session`
9. Klient: redirect na `/generate`
10. Stan: zalogowany ✓

### 5.2 Scenariusz 2: Istniejący użytkownik – Logowanie

1. Użytkownik wchodzi na `/auth/login`
2. Formularz: email, hasło, opcja "Zapamiętaj mnie"
3. Submit → POST `/api/auth/login`
4. Serwer: walidacja, logowanie w Supabase
5. Cookie: ustawienie `session` (timeout 30 dni jeśli "remember me")
6. Klient: redirect na `/generate`
7. Stan: zalogowany ✓

### 5.3 Scenariusz 3: Zalogowany użytkownik – Generowanie fiszek

1. Użytkownik na `/generate`
2. Middleware: sprawdzenie sesji ✓
3. Strona: załadowana
4. Użytkownik: wkleję tekst, klika "Generuj"
5. Request: POST `/api/generations` + tokenu w header (Bearer)
6. Serwer:
   - Walidacja tokenu
   - Extrahowanie user_id
   - Wygenerowanie fiszek
   - Zapis do bazy z `user_id`
7. Klient: wyświetlenie propozycji
8. Użytkownik: akceptuje fiszki
9. Request: POST `/api/flashcards` + lista
10. Serwer: zapis z `user_id`
11. Stan: fiszki zapisane dla użytkownika ✓

### 5.4 Scenariusz 4: Zapomniałem hasła

1. Użytkownik na `/auth/login`
2. Klika "Nie pamiętasz hasła?"
3. Strona: `/auth/forgot-password`
4. Formularz: email
5. Submit → POST `/api/auth/forgot-password`
6. Serwer: Supabase wysyła email z linkiem
7. Klient: wyświetlenie komunikatu "Sprawdź email"
8. Email: link `/auth/reset-password?token=xxx`
9. Użytkownik: klika link w emailu
10. Strona: `/auth/reset-password?token=xxx`
11. Formularz: nowe hasło, potwierdzenie
12. Submit → POST `/api/auth/reset-password` + token
13. Serwer: zmiana hasła w Supabase
14. Klient: redirect na `/auth/login` + komunikat
15. Stan: hasło zmienione ✓

### 5.5 Scenariusz 5: Wylogowanie

1. Użytkownik zalogowany na `/generate`
2. Menu: klika "Wyloguj się"
3. Request: POST `/api/auth/logout`
4. Serwer: anulowanie sesji, usunięcie cookie
5. Klient: redirect na `/auth/login`
6. Stan: anonimowy ✓

---

## 6. STRUKTURA PLIKÓW – PODSUMOWANIE ZMIAN

```
src/
├── components/
│   ├── LoginForm.tsx                    [NOWY]
│   ├── RegisterForm.tsx                 [NOWY]
│   ├── ForgotPasswordForm.tsx           [NOWY]
│   ├── ResetPasswordForm.tsx            [NOWY]
│   ├── AuthHeader.tsx                   [NOWY]
│   ├── ErrorNotification.tsx            [ISTNIEJE - bez zmian]
│   └── ThemeToggle.tsx                  [ISTNIEJE - bez zmian]
│
├── pages/
│   ├── index.astro                      [ZMIANA - redirect logic]
│   ├── generate.astro                   [ZMIANA - sprawdzenie sesji]
│   ├── auth/
│   │   ├── login.astro                  [NOWY]
│   │   ├── register.astro               [NOWY]
│   │   ├── forgot-password.astro        [NOWY]
│   │   └── reset-password.astro         [NOWY]
│   └── api/
│       ├── auth/
│       │   ├── register.ts              [NOWY]
│       │   ├── login.ts                 [NOWY]
│       │   ├── logout.ts                [NOWY]
│       │   ├── forgot-password.ts       [NOWY]
│       │   └── reset-password.ts        [NOWY]
│       ├── flashcards.ts                [ZMIANA - dodanie user_id]
│       └── generations.ts               [ZMIANA - dodanie user_id]
│
├── lib/
│   ├── auth.service.ts                  [NOWY]
│   ├── validation.ts                    [ZMIANA - rozszerzenie]
│   └── utils.ts                         [ISTNIEJE - bez zmian]
│
├── db/
│   ├── supabase.client.ts               [ZMIANA - rozszerzenie auth]
│   ├── supabase.auth.ts                 [NOWY]
│   └── database.types.ts                [ZMIANA - nowe kolumny]
│
├── middleware/
│   └── index.ts                         [ZMIANA - logika sesji]
│
└── layouts/
    └── Layout.astro                     [ZMIANA - auth header]
```

---

## 7. ZMIANY W SCHEMACIE BAZY DANYCH

### 7.1 Nowa kolumna w `generations`

```sql
ALTER TABLE generations ADD COLUMN user_id UUID NOT NULL;
ALTER TABLE generations ADD CONSTRAINT fk_generations_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### 7.2 Nowa kolumna w `flashcards`

```sql
ALTER TABLE flashcards ADD COLUMN user_id UUID NOT NULL;
ALTER TABLE flashcards ADD CONSTRAINT fk_flashcards_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

## 8. UWAGI IMPLEMENTACYJNE

### 8.1 Priorytety

1. Faza 1 (MVP): Logowanie i Rejestracja
2. Faza 2: Reset hasła
3. Faza 3: Profil użytkownika, ustawienia

### 8.2 Testowanie

- Unit testy dla serwisu autentykacji
- Testy E2E dla całego flow logowania
- Testowanie bezpieczeństwa (CSRF, XSS, SQL injection)

### 8.3 Dokumentacja użytkownika

- Instrukcja logowania/rejestracji
- Instrukcja resetu hasła
- FAQ dotyczące bezpieczeństwa

### 8.4 Monitoring

- Logowanie prób logowania
- Logowanie błędów autentykacji
- Monitoring brute force attacks
