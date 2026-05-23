import Groq from "groq-sdk";
import { resolveApiKey } from "../config.js";
import type { BillyConfig, BillyResponse } from "../types.js";
import type { ChatProvider } from "./types.js";

type Message = { role: "system" | "user"; content: string };

export class GroqProvider implements ChatProvider {
  private client: Groq;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private timeout: number;
  private retries: number;

  constructor(config: BillyConfig = {}) {
    this.model = config.model || "llama-3.3-70b-versatile";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;

    const apiKey = resolveApiKey(config.apiKey, "GROQ_API_KEY");
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY required. Get one for free at https://console.groq.com/\n" +
          "\nWays to set it:" +
          "\n  1. Set GROQ_API_KEY environment variable" +
          '\n  2. Pass apiKey in config: billy({ apiKey: "your-key" })' +
          '\n  3. Create billy-sdk.config.json with { "apiKey": "your-key" }' +
          "\n  4. Run: npx billy-sdk config set your-key",
      );
    }

    this.client = new Groq({ apiKey });
  }

  async chat(prompt: string, systemPrompt?: string): Promise<BillyResponse> {
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

  async *chatStream(
    prompt: string,
    systemPrompt?: string,
  ): AsyncIterable<string> {
    const messages: Message[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const stream = await this.client.chat.completions.create(
        {
          model: this.model,
          messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
          stream: true,
        },
        {
          // biome-ignore lint/suspicious/noExplicitAny: AbortSignal type mismatch
          signal: controller.signal as any,
        },
      );

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) yield content;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
