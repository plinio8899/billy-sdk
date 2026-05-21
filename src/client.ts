import type { BillyConfig, BillyResponse, ProviderType } from './types.js';
import type { ChatProvider } from './providers/types.js';
import { GroqProvider } from './providers/groq.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';

const providerMap: Record<ProviderType, new (config: BillyConfig) => ChatProvider> = {
  groq: GroqProvider,
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
};

export class LlmClient {
  private provider: ChatProvider;

  constructor(config: BillyConfig = {}) {
    const providerType: ProviderType = config.provider || 'groq';
    const Provider = providerMap[providerType];
    if (!Provider) {
      throw new Error(`Unknown provider: ${providerType}. Available: ${Object.keys(providerMap).join(', ')}`);
    }
    this.provider = new Provider(config);
  }

  async chat(prompt: string): Promise<BillyResponse> {
    return this.provider.chat(prompt);
  }
}
