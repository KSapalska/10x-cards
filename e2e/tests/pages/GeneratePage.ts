import { type Locator, type Page, expect } from "@playwright/test";

export class GeneratePage {
  readonly page: Page;
  readonly textInputArea: Locator;
  readonly sourceTextTextarea: Locator;
  readonly generateButton: Locator;
  readonly skeletonLoader: Locator;
  readonly flashcardList: Locator;
  readonly flashcardItems: Locator;
  readonly bulkSaveSection: Locator;
  readonly saveAcceptedButton: Locator;
  readonly saveAllButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.textInputArea = page.getByTestId("text-input-area");
    this.sourceTextTextarea = page.getByTestId("source-text-textarea");
    this.generateButton = page.getByTestId("generate-button");
    this.skeletonLoader = page.getByTestId("skeleton-loader");
    this.flashcardList = page.getByTestId("flashcard-list");
    this.flashcardItems = page.getByTestId("flashcard-item");
    this.bulkSaveSection = page.getByTestId("bulk-save-section");
    this.saveAcceptedButton = page.getByTestId("save-accepted-button");
    this.saveAllButton = page.getByTestId("save-all-button");
  }

  async goto() {
    await this.page.goto("/generate");
  }

  async assertOnPage() {
    await expect(this.page.getByRole("heading", { name: /Wygeneruj fiszki z tekstu/i })).toBeVisible();
  }

  async fillSourceText(text: string) {
    await this.sourceTextTextarea.fill(text);
  }

  async clickGenerate() {
    await this.generateButton.click();
  }

  async waitForFlashcardsToLoad() {
    // Wait for skeleton to disappear
    await expect(this.skeletonLoader).toBeHidden({ timeout: 30000 });
    // Wait for flashcard list to appear
    await expect(this.flashcardList).toBeVisible({ timeout: 5000 });
  }

  async getFlashcardCount(): Promise<number> {
    return await this.flashcardItems.count();
  }

  async acceptFlashcard(index = 0) {
    const flashcard = this.flashcardItems.nth(index);
    const acceptButton = flashcard.getByTestId("flashcard-accept-button");
    await acceptButton.click();
  }

  async acceptAllFlashcards() {
    const count = await this.getFlashcardCount();
    for (let i = 0; i < count; i++) {
      await this.acceptFlashcard(i);
    }
  }

  async rejectFlashcard(index = 0) {
    const flashcard = this.flashcardItems.nth(index);
    const rejectButton = flashcard.getByTestId("flashcard-reject-button");
    await rejectButton.click();
  }

  async editFlashcard(index: number, front: string, back: string) {
    const flashcard = this.flashcardItems.nth(index);
    const editButton = flashcard.getByTestId("flashcard-edit-button");
    await editButton.click();

    // Wait for edit mode
    const frontInput = flashcard.getByLabel(/Przód fiszki/i);
    const backInput = flashcard.getByLabel(/Tył fiszki/i);

    await frontInput.fill(front);
    await backInput.fill(back);

    const saveButton = flashcard.getByRole("button", { name: /Zapisz zmiany/i });
    await saveButton.click();
  }

  async clickSaveAccepted() {
    await this.saveAcceptedButton.click();
  }

  async clickSaveAll() {
    await this.saveAllButton.click();
  }

  async waitForSaveSuccess() {
    await expect(this.page.getByText(/Fiszki zostały pomyślnie zapisane/i)).toBeVisible({ timeout: 10000 });
  }
}
