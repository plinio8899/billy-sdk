import { AnthropicProvider } from "./providers/anthropic.js";
import { GroqProvider } from "./providers/groq.js";
import { OpenAIProvider } from "./providers/openai.js";
import type { ChatProvider } from "./providers/types.js";
import type { BillyConfig, BillyResponse, ProviderType } from "./types.js";

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
  private provider: ChatProvider;
  private systemPrompt: string;

  constructor(config: BillyConfig = {}) {
    if (config.providerInstance) {
      this.provider = config.providerInstance as ChatProvider;
    } else {
      const providerType: ProviderType = config.provider || "groq";
      const Provider = providerMap[providerType];
      if (!Provider) {
        throw new Error(
          `Unknown provider: ${providerType}. Available: ${Object.keys(providerMap).join(", ")}`,
        );
      }
      this.provider = new Provider(config);
    }
    this.systemPrompt = config.systemPrompt || "";
  }

  async chat(prompt: string, systemPrompt?: string): Promise<BillyResponse> {
    const sp = systemPrompt ?? this.systemPrompt;
    return this.provider.chat(prompt, sp || undefined);
  }

  chatStream(prompt: string, systemPrompt?: string): AsyncIterable<string> {
    const sp = systemPrompt ?? this.systemPrompt;
    return this.provider.chatStream(prompt, sp || undefined);
  }
}
