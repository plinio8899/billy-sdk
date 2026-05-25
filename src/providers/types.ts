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
}

export type ProviderConstructor = new (config: BillyConfig) => ChatProvider;
