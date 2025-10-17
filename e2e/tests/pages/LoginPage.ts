import { type Locator, type Page, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/Email/i);
    this.passwordInput = page.getByLabel(/Hasło/i);
    this.submitButton = page.getByRole("button", { name: /Zaloguj się/i });
  }

  async goto() {
    await this.page.goto("/auth/login");
  }

  async assertOnPage() {
    await expect(this.page.getByRole("heading", { name: /Zaloguj się/i })).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}


