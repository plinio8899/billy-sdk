import type { BillyConfig, BillyResponse } from "../types.js";
import type { ChatProvider } from "./types.js";

type Message = { role: "system" | "user"; content: string };

export abstract class BaseProvider implements ChatProvider {
  protected model: string;
  protected temperature: number;
  protected maxTokens: number;
  protected timeout: number;
  protected retries: number;

  constructor(config: BillyConfig = {}) {
    this.model = config.model || this.defaultModel();
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  protected abstract defaultModel(): string;
  protected abstract buildMessages(
    prompt: string,
    systemPrompt?: string,
  ): Message[];

  protected abstract completion(
    messages: Message[],
    systemPrompt: string | undefined,
    signal: AbortSignal,
  ): Promise<{ content: string }>;

  protected abstract streamCompletion(
    messages: Message[],
    systemPrompt: string | undefined,
    signal: AbortSignal,
  ): AsyncIterable<string>;

  async chat(prompt: string, systemPrompt?: string): Promise<BillyResponse> {
    let lastError: Error | undefined;
    const messages = this.buildMessages(prompt, systemPrompt);

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await this.completion(
          messages,
          systemPrompt,
          controller.signal,
        );

        clearTimeout(timeoutId);

        return { content: response.content.trim() };
      } catch (error: unknown) {
        lastError = error as Error;

        if (attempt < this.retries) {
          await this.delay(1000 * attempt);
        }
      }
    }

    return {
      content: "",
      error: lastError?.message || "Unknown error",
    };
  }

  async *chatStream(
    prompt: string,
    systemPrompt?: string,
  ): AsyncIterable<string> {
    const messages = this.buildMessages(prompt, systemPrompt);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const stream = this.streamCompletion(
        messages,
        systemPrompt,
        controller.signal,
      );

      for await (const chunk of stream) {
        yield chunk;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
