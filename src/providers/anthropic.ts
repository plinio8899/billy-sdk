import { createRequire } from "node:module";
import type { BillyConfig, BillyResponse } from "../types.js";
import type { ChatProvider } from "./types.js";

const require = createRequire(import.meta.url);

export class AnthropicProvider implements ChatProvider {
  // biome-ignore lint/suspicious/noExplicitAny: optional SDK dependency
  private client: any;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private timeout: number;
  private retries: number;

  constructor(config: BillyConfig = {}) {
    this.model = config.model || "claude-3-haiku-20240307";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;

    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY required.\n" +
          "Set ANTHROPIC_API_KEY environment variable or pass apiKey in config.",
      );
    }

    this.client = this.loadClient(apiKey);
  }

  // biome-ignore lint/suspicious/noExplicitAny: optional SDK dependency
  private loadClient(apiKey: string): any {
    try {
      const { Anthropic } = require("@anthropic-ai/sdk");
      return new Anthropic({ apiKey, timeout: this.timeout });
    } catch {
      throw new Error(
        "@anthropic-ai/sdk package not found. Install it:\n" +
          "  npm install @anthropic-ai/sdk",
      );
    }
  }

  async chat(
    prompt: string,
    systemPrompt?: string,
  ): Promise<BillyResponse> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await this.client.messages.create(
          {
            model: this.model,
            max_tokens: this.maxTokens,
            system: systemPrompt || undefined,
            messages: [{ role: "user", content: prompt }],
            temperature: this.temperature,
          },
          {
            // biome-ignore lint/suspicious/noExplicitAny: AbortSignal type mismatch
            signal: controller.signal as any,
          },
        );

        clearTimeout(timeoutId);

        const content = response.content?.[0]?.text || "";

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
