import type { AbortOptions } from "node-fetch";
import { OpenRouterError } from "./openrouter.types";

interface OpenRouterConfig {
  apiKey: string;
  timeout?: number; // ms
}

interface ResponseFormat {
  name: string;
  schema: unknown;
}

export class OpenRouterService {
  private model = "openai/gpt-4o-mini";
  private temperature = 0.7;
  private top_p = 1;
  private systemMessage = "";
  private userMessage = "";
  private responseFormat?: ResponseFormat;

  constructor(private readonly config: OpenRouterConfig) {
    if (!config.apiKey) {
      throw new Error("OpenRouter API key is required");
    }
  }

  setModel(model: string, params?: { temperature?: number; top_p?: number }) {
    this.model = model;
    if (params?.temperature !== undefined) this.temperature = params.temperature;
    if (params?.top_p !== undefined) this.top_p = params.top_p;
    return this;
  }

  setSystemMessage(message: string) {
    this.systemMessage = message;
    return this;
  }

  setResponseFormat(format: ResponseFormat) {
    this.responseFormat = format;
    return this;
  }

  setUserMessage(message: string) {
    this.userMessage = message;
    return this;
  }

  async sendChatMessage(): Promise<string> {
    const body = {
      model: this.model,
      messages: [
        { role: "system", content: this.systemMessage },
        { role: "user", content: this.userMessage },
      ],
      temperature: this.temperature,
      top_p: this.top_p,
      ...(this.responseFormat ? { response_format: this.responseFormat } : {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout ?? 60000);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      } as RequestInit & AbortOptions);

      if (!response.ok) {
        const text = await response.text();
        throw new OpenRouterError(text, `${response.status}`);
      }

      const json = (await response.json()) as any;
      // Assuming OpenRouter returns OpenAI-compatible schema
      const content = json.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Invalid response from OpenRouter: missing content");
      }
      return content;
    } finally {
      clearTimeout(timeout);
    }
  }
}
