import type { BillyConfig, BillyOptions, BillyResponse } from "../types.js";

export interface ChatProvider {
  chat(
    prompt: string,
    systemPrompt?: string,
    options?: BillyOptions,
  ): Promise<BillyResponse>;
  chatStream(
    prompt: string,
    systemPrompt?: string,
    options?: BillyOptions,
  ): AsyncIterable<string>;
  /** Whether this provider supports native JSON structured output */
  supportsNativeJson(): boolean;
}

export type ProviderConstructor = new (config: BillyConfig) => ChatProvider;
