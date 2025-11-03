import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { GeneratePage } from "./pages/GeneratePage";

test.describe("Flashcard Generation Flow", () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and storage before each test
    await context.clearCookies();

    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.assertOnPage();

    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
    }

    await loginPage.login(email, password);

    // Wait for redirect to /generate
    await page.waitForURL("/generate", { timeout: 10000 });
  });

  test.skip("should generate flashcards from source text", async ({ page }) => {
    const generatePage = new GeneratePage(page);

    // Verify we're on the generate page
    await generatePage.assertOnPage();

    // Prepare source text (minimum 1000 characters)
    const sourceText = `
React to nowoczesna biblioteka JavaScript do budowania interfejsów użytkownika. 
Została stworzona przez Facebook i jest obecnie jedną z najpopularniejszych bibliotek 
do tworzenia aplikacji webowych.

Podstawowe koncepcje React:

1. Komponenty - React opiera się na komponentach, które są niezależnymi, wielokrotnego 
użytku kawałkami kodu. Komponenty mogą być klasami lub funkcjami. Funkcyjne komponenty 
są obecnie preferowane ze względu na prostotę i możliwość użycia hooków.

2. JSX - składnia rozszerzająca JavaScript, która pozwala pisać kod przypominający HTML 
bezpośrednio w plikach JavaScript. JSX jest kompilowany do wywołań funkcji JavaScript.

3. Virtual DOM - React używa wirtualnego DOM do optymalizacji renderowania. Zamiast 
bezpośrednio manipulować prawdziwym DOM, React tworzy wirtualną reprezentację, 
porównuje zmiany i aktualizuje tylko te części, które się zmieniły.

4. Hooks - wprowadzone w React 16.8, hooks pozwalają używać stanu i innych funkcji 
React w komponentach funkcyjnych. Najpopularniejsze to useState, useEffect, useContext.

5. Props - właściwości przekazywane do komponentów, które pozwalają na komunikację 
między komponentami rodzica i dziecka. Props są tylko do odczytu.

6. State - wewnętrzny stan komponentu, który może się zmieniać w czasie. 
Zmiana stanu powoduje ponowne renderowanie komponentu.

React promuje jednokierunkowy przepływ danych, co ułatwia śledzenie zmian 
i debugowanie aplikacji. Ekosystem React jest bogaty w biblioteki i narzędzia, 
takie jak React Router do routingu, Redux do zarządzania stanem globalnym, 
czy Next.js jako framework do tworzenia aplikacji serwerowych.
    `.trim();

    // Fill source text
    await generatePage.fillSourceText(sourceText);

    // Verify generate button is enabled
    await expect(generatePage.generateButton).toBeEnabled();

    // Click generate
    await generatePage.clickGenerate();

    // Verify skeleton loader appears
    await expect(generatePage.skeletonLoader).toBeVisible();

    // Wait for flashcards to load
    await generatePage.waitForFlashcardsToLoad();

    // Verify flashcards were generated
    const flashcardCount = await generatePage.getFlashcardCount();
    expect(flashcardCount).toBeGreaterThan(0);
    // eslint-disable-next-line no-console
    console.log(`Generated ${flashcardCount} flashcards`);

    // Verify bulk save section is visible
    await expect(generatePage.bulkSaveSection).toBeVisible();
  });

  test.skip("should accept flashcards and save them", async ({ page }) => {
    const generatePage = new GeneratePage(page);

    // Prepare and generate flashcards
    const sourceText = `
TypeScript to typowany nadzbiór JavaScript, który kompiluje się do czystego JavaScript.
Został stworzony przez Microsoft i jest coraz bardziej popularny w społeczności programistów.

Główne zalety TypeScript:

1. Statyczne typowanie - TypeScript dodaje opcjonalne typy statyczne do JavaScript, 
co pomaga wychwytywać błędy na etapie kompilacji, zanim kod zostanie uruchomiony.

2. Lepsze narzędzia - dzięki typom, edytory kodu mogą oferować lepsze autouzupełnianie, 
refaktoryzację i nawigację po kodzie.

3. Zgodność z JavaScript - każdy poprawny kod JavaScript jest również poprawnym kodem 
TypeScript. Możesz stopniowo migrować projekt z JS do TS.

4. Interfejsy i typy - TypeScript pozwala definiować interfejsy i typy niestandardowe, 
co ułatwia modelowanie struktur danych i API.

5. Klasy i dziedziczenie - TypeScript wspiera programowanie obiektowe z klasami, 
interfejsami i modyfikatorami dostępu (public, private, protected).

6. Generyki - pozwalają tworzyć komponenty wielokrotnego użytku, które mogą działać 
z różnymi typami danych zachowując bezpieczeństwo typów.

7. Enum - TypeScript dodaje enumy, które pozwalają definiować zestaw nazwanych stałych.

TypeScript jest szczególnie przydatny w dużych projektach, gdzie bezpieczeństwo typów 
i łatwość refaktoryzacji są kluczowe. Wiele popularnych frameworków i bibliotek, 
takich jak Angular, Vue 3 czy React (z oficjalnym wsparciem), ma wbudowane wsparcie 
dla TypeScript.
    `.trim();

    await generatePage.fillSourceText(sourceText);
    await generatePage.clickGenerate();
    await generatePage.waitForFlashcardsToLoad();

    const flashcardCount = await generatePage.getFlashcardCount();
    expect(flashcardCount).toBeGreaterThan(0);

    // Accept first flashcard
    await generatePage.acceptFlashcard(0);

    // Verify accept button changed state
    const firstFlashcard = generatePage.flashcardItems.first();
    const acceptButton = firstFlashcard.getByTestId("flashcard-accept-button");
    await expect(acceptButton).toHaveText(/Zaakceptowano/i);

    // Accept second flashcard if exists
    if (flashcardCount > 1) {
      await generatePage.acceptFlashcard(1);
    }

    // Save accepted flashcards
    await expect(generatePage.saveAcceptedButton).toBeEnabled();
    await generatePage.clickSaveAccepted();

    // Wait for success message
    await generatePage.waitForSaveSuccess();

    // Verify flashcards were cleared after save
    await expect(generatePage.flashcardList).toBeHidden({ timeout: 5000 });
  });

  test.skip("should reject unwanted flashcards", async ({ page }) => {
    const generatePage = new GeneratePage(page);

    const sourceText = `
Node.js to środowisko uruchomieniowe JavaScript po stronie serwera, zbudowane na silniku 
V8 Google Chrome. Pozwala programistom używać JavaScript do pisania skryptów po stronie 
serwera, co umożliwia generowanie dynamicznej zawartości strony przed wysłaniem jej do 
przeglądarki użytkownika.

Kluczowe cechy Node.js:

1. Asynchroniczność - Node.js używa nieblokującego, sterowanego zdarzeniami modelu I/O, 
co czyni go lekkim i wydajnym, idealnym do aplikacji intensywnie wykorzystujących dane 
w czasie rzeczywistym.

2. NPM (Node Package Manager) - największe repozytorium bibliotek open-source na świecie, 
które znacznie ułatwia zarządzanie zależnościami projektu.

3. Jednowątkowy model - Node.js działa na jednym wątku, ale wykorzystuje pętle zdarzeń 
do obsługi wielu operacji jednocześnie, co eliminuje problemy z zarządzaniem wieloma wątkami.

4. Moduły - Node.js posiada bogaty ekosystem modułów, które można łatwo importować 
i używać w projektach.

5. Skalowalność - dzięki nieblokującemu modelowi I/O, aplikacje Node.js mogą obsługiwać 
tysiące jednoczesnych połączeń z minimalnym obciążeniem.

Node.js jest szeroko stosowany do budowania aplikacji webowych, API RESTful, 
aplikacji czasu rzeczywistego (jak czaty), narzędzi wiersza poleceń, a nawet 
aplikacji mobilnych (z React Native).
    `.trim();

    await generatePage.fillSourceText(sourceText);
    await generatePage.clickGenerate();
    await generatePage.waitForFlashcardsToLoad();

    const initialCount = await generatePage.getFlashcardCount();
    expect(initialCount).toBeGreaterThan(0);

    // Reject first flashcard
    await generatePage.rejectFlashcard(0);

    // Verify flashcard count decreased
    const newCount = await generatePage.getFlashcardCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test.skip("should disable generate button with insufficient text", async ({ page }) => {
    const generatePage = new GeneratePage(page);

    await generatePage.assertOnPage();

    // Fill with text shorter than 1000 characters
    const shortText = "To jest za krótki tekst do generowania fiszek.";
    await generatePage.fillSourceText(shortText);

    // Verify generate button is disabled
    await expect(generatePage.generateButton).toBeDisabled();
  });
});
