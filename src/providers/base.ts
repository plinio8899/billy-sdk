import type {
  BillyConfig,
  BillyOptions,
  BillyResponse,
  FileContent,
} from "../types.js";
import type { ChatProvider } from "./types.js";

export type Message = {
  role: "system" | "user";
  content: string | Record<string, unknown>[];
};

function combineSignals(...signals: (AbortSignal | undefined)[]): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const valid = signals.filter(Boolean) as AbortSignal[];
  if (valid.length === 0)
    return { signal: new AbortController().signal, cleanup: () => {} };
  if (valid.length === 1) return { signal: valid[0], cleanup: () => {} };

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  for (const signal of valid) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return { signal: controller.signal, cleanup: () => {} };
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      for (const signal of valid) {
        signal.removeEventListener("abort", onAbort);
      }
    },
  };
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
    files?: FileContent[],
  ): Promise<Message[]>;

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
    const files = options?.files;
    const messages = await this.buildMessages(prompt, systemPrompt, files);

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

          const { signal, cleanup } = combineSignals(
            controller.signal,
            options?.signal,
          );

          const response = await this.completion(
            messages,
            systemPrompt,
            signal,
          );

          clearTimeout(timeoutId);
          cleanup();
          return { content: response.content.trim() };
        } catch (error: unknown) {
          clearTimeout(timeoutId);
          cleanup();
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
    const files = options?.files;
    const messages = await this.buildMessages(prompt, systemPrompt, files);

    const prevTemp = this.temperature;
    const prevMax = this.maxTokens;
    if (options?.temperature !== undefined)
      this.temperature = options.temperature;
    if (options?.maxTokens !== undefined) this.maxTokens = options.maxTokens;

    let lastError: Error | undefined;
    try {
      for (let attempt = 1; attempt <= this.retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
          const { signal, cleanup } = combineSignals(
            controller.signal,
            options?.signal,
          );
          const stream = this.streamCompletion(messages, systemPrompt, signal);

          for await (const chunk of stream) {
            yield chunk;
          }
          cleanup();
          clearTimeout(timeoutId);
          return;
        } catch (error: unknown) {
          cleanup();
          clearTimeout(timeoutId);
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

    throw lastError || new Error("Stream failed");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
