import { createRequire } from "node:module";
import { resolveApiKey } from "../config.js";
import type { BillyConfig, BillyResponse } from "../types.js";
import type { ChatProvider } from "./types.js";

const require = createRequire(import.meta.url);

type Message = { role: "system" | "user"; content: string };

export class OpenAIProvider implements ChatProvider {
  // biome-ignore lint/suspicious/noExplicitAny: optional SDK dependency
  private client: any;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private timeout: number;
  private retries: number;

  constructor(config: BillyConfig = {}) {
    this.model = config.model || "gpt-4o-mini";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;

    const apiKey = resolveApiKey(config.apiKey, "OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY required.\n" +
          "Set OPENAI_API_KEY environment variable or pass apiKey in config.",
      );
    }

    this.client = this.loadClient(apiKey);
  }

  // biome-ignore lint/suspicious/noExplicitAny: optional SDK dependency
  private loadClient(apiKey: string): any {
    try {
      const OpenAI = require("openai");
      return new OpenAI({ apiKey, timeout: this.timeout });
    } catch {
      throw new Error(
        "openai package not found. Install it:\n" + "  npm install openai",
      );
    }
  }

  async chat(
    prompt: string,
    systemPrompt?: string,
  ): Promise<BillyResponse> {
    let lastError: Error | undefined;

    const messages: Message[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await this.client.chat.completions.create(
          {
            model: this.model,
            messages,
            temperature: this.temperature,
            max_tokens: this.maxTokens,
          },
          {
            // biome-ignore lint/suspicious/noExplicitAny: AbortSignal type mismatch
            signal: controller.signal as any,
          },
        );

        clearTimeout(timeoutId);

        const content = response.choices[0]?.message?.content || "";

        return {
          content: content.trim(),
          raw: content.trim(),
        };
      } catch (error: unknown) {
        lastError = error as Error;

        if (attempt < this.retries) {
          await this.delay(1000 * attempt);
        }
      }
    }

    return {
      content: "",
      raw: "",
      error: lastError?.message || "Unknown error",
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
