import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Flashcard Management (CRUD Operations)", () => {
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

    // Wait for redirect
    await page.waitForURL("/generate", { timeout: 10000 });
  });

  test.skip("GET /api/flashcards - should return paginated list of flashcards", async ({ page }) => {
    // Create a test flashcard first
    const createResponse = await page.request.post("/api/flashcards", {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        flashcards: [
          {
            front: "Test Question E2E",
            back: "Test Answer E2E",
            source: "manual",
            generation_id: null,
          },
        ],
      },
    });

    expect(createResponse.ok()).toBeTruthy();

    // Now get the list
    const response = await page.request.get("/api/flashcards?page=1&limit=10");

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.pagination).toHaveProperty("page", 1);
    expect(data.pagination).toHaveProperty("limit", 10);
    expect(data.pagination).toHaveProperty("total");
    expect(data.pagination.total).toBeGreaterThan(0);

    // Verify structure of first flashcard
    if (data.data.length > 0) {
      const flashcard = data.data[0];
      expect(flashcard).toHaveProperty("id");
      expect(flashcard).toHaveProperty("front");
      expect(flashcard).toHaveProperty("back");
      expect(flashcard).toHaveProperty("source");
      expect(flashcard).toHaveProperty("created_at");
      expect(flashcard).toHaveProperty("updated_at");
    }
  });

  test.skip("GET /api/flashcards - should filter by source", async ({ page }) => {
    const response = await page.request.get("/api/flashcards?source=manual&limit=10");

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // All returned flashcards should have source="manual"
    data.data.forEach((flashcard: { source: string }) => {
      expect(flashcard.source).toBe("manual");
    });
  });

  test.skip("GET /api/flashcards - should validate query params", async ({ page }) => {
    // Invalid page (negative)
    const response1 = await page.request.get("/api/flashcards?page=-1");
    expect(response1.status()).toBe(400);

    // Invalid limit (too high)
    const response2 = await page.request.get("/api/flashcards?limit=200");
    expect(response2.status()).toBe(400);

    // Invalid sort field
    const response3 = await page.request.get("/api/flashcards?sort=invalid_field");
    expect(response3.status()).toBe(400);
  });

  test.skip("GET /api/flashcards/[id] - should return flashcard by ID", async ({ page }) => {
    // First create a flashcard
    const createResponse = await page.request.post("/api/flashcards", {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        flashcards: [
          {
            front: "Get By ID Test",
            back: "This is a test",
            source: "manual",
            generation_id: null,
          },
        ],
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const flashcardId = created.flashcards[0].id;

    // Now get it by ID
    const response = await page.request.get(`/api/flashcards/${flashcardId}`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const flashcard = await response.json();

    expect(flashcard.id).toBe(flashcardId);
    expect(flashcard.front).toBe("Get By ID Test");
    expect(flashcard.back).toBe("This is a test");
    expect(flashcard.source).toBe("manual");
  });

  test.skip("GET /api/flashcards/[id] - should return 404 for non-existent flashcard", async ({ page }) => {
    const response = await page.request.get("/api/flashcards/999999999");

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Flashcard not found");
  });

  test.skip("GET /api/flashcards/[id] - should return 400 for invalid ID", async ({ page }) => {
    const response = await page.request.get("/api/flashcards/invalid-id");

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid flashcard ID");
  });

  test.skip("PUT /api/flashcards/[id] - should update flashcard", async ({ page }) => {
    // Create a flashcard
    const createResponse = await page.request.post("/api/flashcards", {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        flashcards: [
          {
            front: "Original Question",
            back: "Original Answer",
            source: "manual",
            generation_id: null,
          },
        ],
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const flashcardId = created.flashcards[0].id;

    // Update it
    const updateResponse = await page.request.put(`/api/flashcards/${flashcardId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        front: "Updated Question",
        back: "Updated Answer",
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    expect(updateResponse.status()).toBe(200);

    const updated = await updateResponse.json();

    expect(updated.id).toBe(flashcardId);
    expect(updated.front).toBe("Updated Question");
    expect(updated.back).toBe("Updated Answer");
    expect(updated.source).toBe("manual"); // Should remain manual
  });

  test.skip("PUT /api/flashcards/[id] - should change source from ai-full to ai-edited", async ({ page }) => {
    // First, generate flashcards via AI to get one with source="ai-full"
    await page.goto("/generate");

    const sourceText = `
    JavaScript to interpretowany język programowania używany głównie do tworzenia interaktywnych 
    stron internetowych. Został stworzony przez Brendana Eicha w 1995 roku dla przeglądarki 
    Netscape Navigator.
    
    Kluczowe cechy JavaScript:
    
    1. Dynamiczne typowanie - zmienne nie wymagają deklaracji typu, typ jest określany w czasie 
    wykonania. To pozwala na większą elastyczność, ale może prowadzić do błędów runtime.
    
    2. Prototypowe dziedziczenie - JavaScript używa prototypów zamiast klas (choć składnia klas 
    została dodana w ES6). Każdy obiekt może dziedziczyć właściwości i metody z innych obiektów.
    
    3. First-class functions - funkcje są obiektami pierwszej klasy i mogą być przekazywane 
    jako argumenty, zwracane z innych funkcji oraz przypisywane do zmiennych.
    
    4. Closure - funkcje mają dostęp do zmiennych z zakresu zewnętrznego nawet po zakończeniu 
    wykonania funkcji zewnętrznej. To potężna cecha używana w wielu wzorcach programowania.
    
    5. Event loop - JavaScript używa pętli zdarzeń do asynchronicznego przetwarzania, co pozwala 
    na nieblokujące operacje I/O. Dzięki temu aplikacje mogą obsługiwać wiele operacji jednocześnie.
    
    6. DOM manipulation - JavaScript może dynamicznie modyfikować HTML i CSS, co umożliwia 
    tworzenie interaktywnych interfejsów użytkownika.
    `.trim();

    const textarea = page.locator("textarea");
    await textarea.clear();
    await textarea.pressSequentially(sourceText, { delay: 0 });

    // Wait for button to be enabled
    await page.waitForSelector('button:has-text("Generuj fiszki"):not([disabled])', { timeout: 5000 });

    await page.click('button:has-text("Generuj fiszki")');

    // Wait for flashcards to be generated
    await page.waitForSelector('[data-testid="flashcard-item"]', { timeout: 60000 });

    // Accept at least one flashcard
    const acceptButton = page.locator('[data-testid="flashcard-accept-button"]').first();
    await acceptButton.click();

    // Save the accepted flashcard
    await page.click('button:has-text("Zapisz zaakceptowane")');

    // Wait for success message
    await page.waitForSelector("text=Fiszki zostały pomyślnie zapisane", { timeout: 10000 });

    // Get the list of flashcards to find the one with ai-full source
    const listResponse = await page.request.get("/api/flashcards?source=ai-full&limit=1");
    const list = await listResponse.json();

    if (list.data.length > 0) {
      const aiFlashcard = list.data[0];
      const flashcardId = aiFlashcard.id;

      // Update the ai-full flashcard
      const updateResponse = await page.request.put(`/api/flashcards/${flashcardId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          front: "Edited AI Question",
        },
      });

      expect(updateResponse.ok()).toBeTruthy();

      const updated = await updateResponse.json();

      // Source should have changed from "ai-full" to "ai-edited"
      expect(updated.source).toBe("ai-edited");
      expect(updated.front).toBe("Edited AI Question");
    }
  });

  test.skip("PUT /api/flashcards/[id] - should validate input", async ({ page }) => {
    // Create a flashcard
    const createResponse = await page.request.post("/api/flashcards", {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        flashcards: [
          {
            front: "Test",
            back: "Test",
            source: "manual",
            generation_id: null,
          },
        ],
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const flashcardId = created.flashcards[0].id;

    // Try to update with front too long (> 200 chars)
    const longFront = "a".repeat(201);
    const response1 = await page.request.put(`/api/flashcards/${flashcardId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        front: longFront,
      },
    });

    expect(response1.status()).toBe(400);

    // Try to update with empty body
    const response2 = await page.request.put(`/api/flashcards/${flashcardId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {},
    });

    expect(response2.status()).toBe(400);
  });

  test.skip("PUT /api/flashcards/[id] - should return 404 for non-existent flashcard", async ({ page }) => {
    const response = await page.request.put("/api/flashcards/999999999", {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        front: "Updated",
      },
    });

    expect(response.status()).toBe(404);
  });

  test.skip("DELETE /api/flashcards/[id] - should delete flashcard", async ({ page }) => {
    // Create a flashcard
    const createResponse = await page.request.post("/api/flashcards", {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        flashcards: [
          {
            front: "To Be Deleted",
            back: "Will be removed",
            source: "manual",
            generation_id: null,
          },
        ],
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const flashcardId = created.flashcards[0].id;

    // Delete it
    const deleteResponse = await page.request.delete(`/api/flashcards/${flashcardId}`);

    expect(deleteResponse.ok()).toBeTruthy();
    expect(deleteResponse.status()).toBe(200);

    const result = await deleteResponse.json();
    expect(result.success).toBe(true);
    expect(result.message).toBe("Flashcard deleted successfully");

    // Verify it's gone
    const getResponse = await page.request.get(`/api/flashcards/${flashcardId}`);
    expect(getResponse.status()).toBe(404);
  });

  test.skip("DELETE /api/flashcards/[id] - should return 404 for non-existent flashcard", async ({ page }) => {
    const response = await page.request.delete("/api/flashcards/999999999");

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Flashcard not found");
  });

  test.skip("DELETE /api/flashcards/[id] - should return 400 for invalid ID", async ({ page }) => {
    const response = await page.request.delete("/api/flashcards/not-a-number");

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid flashcard ID");
  });

  test.skip("Full CRUD flow - create, read, update, delete", async ({ page }) => {
    // 1. CREATE
    const createResponse = await page.request.post("/api/flashcards", {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        flashcards: [
          {
            front: "CRUD Test Question",
            back: "CRUD Test Answer",
            source: "manual",
            generation_id: null,
          },
        ],
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const flashcardId = created.flashcards[0].id;

    // 2. READ (by ID)
    const getByIdResponse = await page.request.get(`/api/flashcards/${flashcardId}`);
    expect(getByIdResponse.ok()).toBeTruthy();
    const flashcard = await getByIdResponse.json();
    expect(flashcard.front).toBe("CRUD Test Question");

    // 3. READ (in list)
    const getListResponse = await page.request.get("/api/flashcards?limit=100");
    const list = await getListResponse.json();
    const foundInList = list.data.find((f: { id: number }) => f.id === flashcardId);
    expect(foundInList).toBeDefined();

    // 4. UPDATE
    const updateResponse = await page.request.put(`/api/flashcards/${flashcardId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        front: "CRUD Test Question UPDATED",
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updated = await updateResponse.json();
    expect(updated.front).toBe("CRUD Test Question UPDATED");
    expect(updated.back).toBe("CRUD Test Answer"); // Should remain unchanged

    // 5. DELETE
    const deleteResponse = await page.request.delete(`/api/flashcards/${flashcardId}`);
    expect(deleteResponse.ok()).toBeTruthy();

    // 6. VERIFY DELETED
    const verifyResponse = await page.request.get(`/api/flashcards/${flashcardId}`);
    expect(verifyResponse.status()).toBe(404);
  });
});
