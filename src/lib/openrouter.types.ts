export class OpenRouterError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "OpenRouterError";
    this.code = code;
  }
}
