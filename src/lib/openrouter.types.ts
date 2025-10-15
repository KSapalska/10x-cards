// Typy błędów
export class OpenRouterError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "OpenRouterError";
    this.code = code;
  }
}

export class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string) {
    super(message, "AUTH_ERROR");
    this.name = "OpenRouterAuthError";
  }
}

export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(message: string) {
    super(message, "RATE_LIMIT_ERROR");
    this.name = "OpenRouterRateLimitError";
  }
}

export class OpenRouterValidationError extends OpenRouterError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "OpenRouterValidationError";
  }
}

export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string) {
    super(message, "NETWORK_ERROR");
    this.name = "OpenRouterNetworkError";
  }
}

// Parametry modelu
export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// Schemat JSON dla structured output
export interface JSONSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

// Format odpowiedzi
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    schema: JSONSchema;
    strict?: boolean;
  };
}

// Wiadomość w rozmowie
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Payload żądania do API
export interface RequestPayload {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
}

// Odpowiedź z API
export interface ApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Konfiguracja serwisu
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}
