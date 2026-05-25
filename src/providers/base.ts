import type { BillyConfig, BillyOptions, BillyResponse } from "../types.js";
import type { ChatProvider } from "./types.js";

type Message = { role: "system" | "user"; content: string };

function combineSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const valid = signals.filter(Boolean) as AbortSignal[];
  if (valid.length === 0) return new AbortController().signal;
  if (valid.length === 1) return valid[0];

  const controller = new AbortController();
  for (const signal of valid) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}

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

  async chat(
    prompt: string,
    systemPrompt?: string,
    options?: BillyOptions,
  ): Promise<BillyResponse> {
    let lastError: Error | undefined;
    const messages = this.buildMessages(prompt, systemPrompt);

    const prevTemp = this.temperature;
    const prevMax = this.maxTokens;
    if (options?.temperature !== undefined)
      this.temperature = options.temperature;
    if (options?.maxTokens !== undefined) this.maxTokens = options.maxTokens;

    try {
      for (let attempt = 1; attempt <= this.retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);

          const signal = combineSignals(controller.signal, options?.signal);

          const response = await this.completion(
            messages,
            systemPrompt,
            signal,
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
    } finally {
      this.temperature = prevTemp;
      this.maxTokens = prevMax;
    }

    return {
      content: "",
      error: lastError?.message || "Unknown error",
    };
  }

  async *chatStream(
    prompt: string,
    systemPrompt?: string,
    options?: BillyOptions,
  ): AsyncIterable<string> {
    const messages = this.buildMessages(prompt, systemPrompt);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const prevTemp = this.temperature;
    const prevMax = this.maxTokens;
    if (options?.temperature !== undefined)
      this.temperature = options.temperature;
    if (options?.maxTokens !== undefined) this.maxTokens = options.maxTokens;

    try {
      const signal = combineSignals(controller.signal, options?.signal);

      const stream = this.streamCompletion(messages, systemPrompt, signal);

      for await (const chunk of stream) {
        yield chunk;
      }
    } finally {
      clearTimeout(timeoutId);
      this.temperature = prevTemp;
      this.maxTokens = prevMax;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
