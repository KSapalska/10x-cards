import { type Locator, type Page, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly loginForm: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginForm = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
  }

  async goto() {
    await this.page.goto("/auth/login");
  }

  async assertOnPage() {
    await expect(this.page.getByRole("heading", { name: /Zaloguj się/i })).toBeVisible();
  }

  async login(email: string, password: string) {
    // Wait for React to hydrate and form to be interactive
    await this.page.waitForTimeout(1000);

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
