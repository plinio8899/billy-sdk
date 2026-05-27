import { AnthropicProvider } from "./providers/anthropic.js";
import { GroqProvider } from "./providers/groq.js";
import { OpenAIProvider } from "./providers/openai.js";
import type { ChatProvider } from "./providers/types.js";
import type {
  BillyConfig,
  BillyOptions,
  BillyResponse,
  ProviderType,
} from "./types.js";

const providerMap: Record<
  ProviderType,
  new (
    config: BillyConfig,
  ) => ChatProvider
> = {
  groq: GroqProvider,
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
};

export class LlmClient {
  private primaryProvider: ChatProvider;
  private systemPrompt: string;
  private config: BillyConfig;

  constructor(config: BillyConfig = {}) {
    this.config = config;
    if (config.providerInstance) {
      this.primaryProvider = config.providerInstance as ChatProvider;
    } else {
      const providerType: ProviderType = config.provider || "groq";
      const Provider = providerMap[providerType];
      if (!Provider) {
        throw new Error(
          `Unknown provider: ${providerType}. Available: ${Object.keys(providerMap).join(", ")}`,
        );
      }
      this.primaryProvider = new Provider(config);
    }
    this.systemPrompt = config.systemPrompt || "";
  }

  private getProviderByType(
    type: ProviderType,
    overrideConfig?: Partial<BillyConfig>,
  ): ChatProvider {
    if (overrideConfig?.providerInstance) {
      return overrideConfig.providerInstance as ChatProvider;
    }
    const Provider = providerMap[type];
    if (!Provider) {
      throw new Error(`Unknown provider: ${type}`);
    }
    const mergedConfig = { ...this.config, ...overrideConfig, provider: type };
    return new Provider(mergedConfig);
  }

  async chat(
    prompt: string,
    systemPrompt?: string,
    options?: BillyOptions,
  ): Promise<BillyResponse> {
    const sp = systemPrompt ?? this.systemPrompt;

    const providers: { provider: ChatProvider; label: string }[] = [
      { provider: this.primaryProvider, label: this.config.provider || "groq" },
    ];

    if (this.config.fallback) {
      for (const fallbackType of this.config.fallback) {
        const override = this.config.fallbackConfig?.[fallbackType];
        providers.push({
          provider: this.getProviderByType(fallbackType, override),
          label: fallbackType,
        });
      }
    }

    let lastError: Error | undefined;
    for (const { provider } of providers) {
      try {
        return await provider.chat(prompt, sp || undefined, options);
      } catch (error: unknown) {
        lastError = error as Error;
      }
    }

    return {
      content: "",
      error: lastError?.message || "All providers failed",
    };
  }

  chatStream(
    prompt: string,
    systemPrompt?: string,
    options?: BillyOptions,
  ): AsyncIterable<string> {
    const sp = systemPrompt ?? this.systemPrompt;

    const providers: { provider: ChatProvider; label: string }[] = [
      { provider: this.primaryProvider, label: this.config.provider || "groq" },
    ];

    if (this.config.fallback) {
      for (const fallbackType of this.config.fallback) {
        const override = this.config.fallbackConfig?.[fallbackType];
        providers.push({
          provider: this.getProviderByType(fallbackType, override),
          label: fallbackType,
        });
      }
    }

    return {
      async *[Symbol.asyncIterator]() {
        let lastError: Error | undefined;
        for (const { provider } of providers) {
          try {
            const stream = provider.chatStream(
              prompt,
              sp || undefined,
              options,
            );
            for await (const chunk of stream) {
              yield chunk;
            }
            return;
          } catch (error: unknown) {
            lastError = error as Error;
          }
        }
        throw lastError || new Error("All providers failed");
      },
    };
  }
}
