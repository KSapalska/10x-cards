import type {
  OpenRouterConfig,
  ModelParameters,
  ResponseFormat,
  RequestPayload,
  ApiResponse,
  JSONSchema,
} from "./openrouter.types";
import {
  OpenRouterError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterValidationError,
  OpenRouterNetworkError,
} from "./openrouter.types";

/**
 * Serwis do komunikacji z API OpenRouter
 * Obsługuje wysyłanie wiadomości do modeli LLM z konfiguracją parametrów i structured output
 */
export class OpenRouterService {
  // Publiczne pola konfiguracyjne
  public readonly apiUrl: string;
  public readonly apiKey: string;

  // Prywatne pola przechowujące bieżącą konfigurację
  private currentModelName: string;
  private currentModelParameters: Required<ModelParameters>;
  private currentSystemMessage: string;
  private currentUserMessage: string;
  private currentResponseFormat?: ResponseFormat;

  // Konfiguracja retry
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly timeout: number;

  /**
   * Konstruktor serwisu OpenRouter
   * @param config Konfiguracja API i parametrów połączenia
   */
  constructor(config: OpenRouterConfig) {
    // Walidacja wymaganych parametrów
    if (!config.apiKey) {
      throw new OpenRouterAuthError("OpenRouter API key is required");
    }

    // Inicjalizacja konfiguracji API
    this.apiKey = config.apiKey;
    this.apiUrl = config.baseUrl ?? "https://openrouter.ai/api/v1/chat/completions";
    this.timeout = config.timeout ?? 60000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;

    // Inicjalizacja domyślnych parametrów modelu
    this.currentModelName = "openai/gpt-4o-mini";
    this.currentModelParameters = {
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    // Inicjalizacja komunikatów
    this.currentSystemMessage = "";
    this.currentUserMessage = "";
  }

  /**
   * Ustawia model i jego parametry
   * @param name Nazwa modelu (np. "openai/gpt-4o-mini")
   * @param parameters Parametry modelu
   */
  public setModel(name: string, parameters?: ModelParameters): void {
    this.currentModelName = name;

    if (parameters) {
      if (parameters.temperature !== undefined) {
        this.currentModelParameters.temperature = parameters.temperature;
      }
      if (parameters.top_p !== undefined) {
        this.currentModelParameters.top_p = parameters.top_p;
      }
      if (parameters.frequency_penalty !== undefined) {
        this.currentModelParameters.frequency_penalty = parameters.frequency_penalty;
      }
      if (parameters.presence_penalty !== undefined) {
        this.currentModelParameters.presence_penalty = parameters.presence_penalty;
      }
    }
  }

  /**
   * Ustawia komunikat systemowy
   * @param message Treść komunikatu systemowego
   */
  public setSystemMessage(message: string): void {
    this.currentSystemMessage = message;
  }

  /**
   * Ustawia komunikat użytkownika
   * @param message Treść komunikatu użytkownika
   */
  public setUserMessage(message: string): void {
    this.currentUserMessage = message;
  }

  /**
   * Konfiguruje schemat JSON dla structured output
   * @param schema Schemat JSON definiujący strukturę odpowiedzi
   */
  public setResponseFormat(schema: JSONSchema): void {
    this.currentResponseFormat = {
      type: "json_schema",
      json_schema: {
        name: "response",
        schema,
        strict: true,
      },
    };
  }

  /**
   * Wysyła wiadomość do API i zwraca odpowiedź
   * @param userMessage Opcjonalny komunikat użytkownika (nadpisuje wcześniej ustawiony)
   * @returns Treść odpowiedzi od modelu
   */
  public async sendChatMessage(userMessage?: string): Promise<string> {
    // Jeśli podano userMessage, użyj go
    if (userMessage !== undefined) {
      this.currentUserMessage = userMessage;
    }

    // Walidacja wymaganych danych
    if (!this.currentUserMessage) {
      throw new OpenRouterValidationError("User message is required");
    }

    // Budowanie payloadu żądania
    const payload = this.buildRequestPayload();

    // Wykonanie żądania z retry
    const response = await this.executeRequest(payload);

    // Parsowanie i walidacja odpowiedzi
    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new OpenRouterValidationError("Invalid response from OpenRouter: missing content");
    }

    return content;
  }

  /**
   * Buduje payload żądania do API
   * @returns Kompletny payload żądania
   */
  private buildRequestPayload(): RequestPayload {
    const messages: RequestPayload["messages"] = [];

    // Dodaj komunikat systemowy jeśli jest ustawiony
    if (this.currentSystemMessage) {
      messages.push({
        role: "system",
        content: this.currentSystemMessage,
      });
    }

    // Dodaj komunikat użytkownika
    messages.push({
      role: "user",
      content: this.currentUserMessage,
    });

    // Zbuduj payload
    const payload: RequestPayload = {
      model: this.currentModelName,
      messages,
      temperature: this.currentModelParameters.temperature,
      top_p: this.currentModelParameters.top_p,
      frequency_penalty: this.currentModelParameters.frequency_penalty,
      presence_penalty: this.currentModelParameters.presence_penalty,
    };

    // Dodaj response_format jeśli jest ustawiony
    if (this.currentResponseFormat) {
      payload.response_format = this.currentResponseFormat;
    }

    return payload;
  }

  /**
   * Wykonuje żądanie HTTP do API z mechanizmem retry i backoff
   * @param payload Payload żądania
   * @returns Odpowiedź z API
   */
  private async executeRequest(payload: RequestPayload): Promise<ApiResponse> {
    let lastError: Error | null = null;
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        return await this.makeHttpRequest(payload);
      } catch (error) {
        lastError = error as Error;

        // Nie retry dla błędów autentykacji i walidacji
        if (error instanceof OpenRouterAuthError || error instanceof OpenRouterValidationError) {
          throw error;
        }

        // Sprawdź czy to ostatnia próba
        if (retryCount === this.maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, retryCount);
        await this.sleep(delay);

        retryCount++;
      }
    }

    // Jeśli wszystkie próby się nie powiodły, rzuć ostatni błąd
    throw lastError || new OpenRouterError("Request failed after retries", "REQUEST_FAILED");
  }

  /**
   * Wykonuje pojedyncze żądanie HTTP do API
   * @param payload Payload żądania
   * @returns Odpowiedź z API
   */
  private async makeHttpRequest(payload: RequestPayload): Promise<ApiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Obsługa różnych kodów błędów
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parsowanie odpowiedzi
      const data = await response.json();
      return data as ApiResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      // Obsługa błędów sieciowych
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new OpenRouterNetworkError(`Request timeout after ${this.timeout}ms`);
        }
        if (error.message.includes("fetch") || error.message.includes("network")) {
          throw new OpenRouterNetworkError(`Network error: ${error.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Obsługuje odpowiedzi błędów z API
   * @param response Response z błędem
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage: string;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || response.statusText;
    } catch {
      errorMessage = response.statusText;
    }

    // Mapowanie kodów błędów na odpowiednie typy
    switch (status) {
      case 401:
      case 403:
        throw new OpenRouterAuthError(`Authentication failed: ${errorMessage}`);
      case 429:
        throw new OpenRouterRateLimitError(`Rate limit exceeded: ${errorMessage}`);
      case 400:
        throw new OpenRouterValidationError(`Invalid request: ${errorMessage}`);
      default:
        throw new OpenRouterError(errorMessage, `HTTP_${status}`);
    }
  }

  /**
   * Pomocnicza funkcja do opóźnienia
   * @param ms Czas w milisekundach
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
