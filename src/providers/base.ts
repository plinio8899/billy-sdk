import type {
  BillyConfig,
  BillyOptions,
  BillyResponse,
  FileContent,
  SchemaDef,
  TokenUsage,
  ToolDefinition,
} from "../types.js";
import type { ChatProvider } from "./types.js";

export type Message = {
  role: "system" | "user";
  content: string | Record<string, unknown>[];
};

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
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
  protected lastUsage: TokenUsage | undefined;

  constructor(config: BillyConfig = {}) {
    this.model = config.model || this.defaultModel();
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  supportsNativeJson(): boolean {
    return false;
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
    schema?: SchemaDef,
    tools?: ToolDefinition[],
  ): Promise<{
    content: string;
    usage?: TokenUsage;
    toolCalls?: { id: string; name: string; args: Record<string, unknown> }[];
  }>;

  protected abstract streamCompletion(
    messages: Message[],
    systemPrompt: string | undefined,
    signal: AbortSignal,
    schema?: SchemaDef,
    tools?: ToolDefinition[],
  ): AsyncIterable<string>;

  protected estimateCost(usage: TokenUsage): number | undefined {
    const pricing = MODEL_PRICING[this.model];
    if (!pricing) return undefined;
    const inputCost = (usage.promptTokens / 1000) * pricing.input;
    const outputCost = (usage.completionTokens / 1000) * pricing.output;
    return Number((inputCost + outputCost).toFixed(6));
  }

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
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let abortCleanup: () => void = () => {};
        try {
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), this.timeout);

          const { signal, cleanup } = combineSignals(
            controller.signal,
            options?.signal,
          );
          abortCleanup = cleanup;

          const response = await this.completion(
            messages,
            systemPrompt,
            signal,
            options?.schema,
            options?.tools,
          );

          clearTimeout(timeoutId);
          abortCleanup();

          const content = response.content.trim();
          if (response.usage) {
            this.lastUsage = response.usage;
          }

          const result: BillyResponse = { content };
          if (response.toolCalls) result.toolCalls = response.toolCalls;
          if (this.lastUsage) {
            result.usage = this.lastUsage;
            const cost = this.estimateCost(this.lastUsage);
            if (cost !== undefined) {
              (
                result.usage as TokenUsage & { estimatedCost?: number }
              ).estimatedCost = cost;
            }
          }
          return result;
        } catch (error: unknown) {
          clearTimeout(timeoutId);
          abortCleanup();
          lastError = error as Error;

          if (attempt < this.retries) {
            await this.delay(1000 * 2 ** (attempt - 1));
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
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let abortCleanup: () => void = () => {};
        try {
          timeoutId = setTimeout(() => controller.abort(), this.timeout);

          const { signal, cleanup } = combineSignals(
            controller.signal,
            options?.signal,
          );
          abortCleanup = cleanup;
          const stream = this.streamCompletion(
            messages,
            systemPrompt,
            signal,
            options?.schema,
            options?.tools,
          );

          for await (const chunk of stream) {
            yield chunk;
          }
          abortCleanup();
          clearTimeout(timeoutId);
          return;
        } catch (error: unknown) {
          abortCleanup();
          clearTimeout(timeoutId);
          lastError = error as Error;
          if (attempt < this.retries) {
            await this.delay(1000 * 2 ** (attempt - 1));
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
