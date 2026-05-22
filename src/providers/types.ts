import type { BillyConfig, BillyResponse } from "../types.js";

export interface ChatProvider {
  chat(prompt: string, systemPrompt?: string): Promise<BillyResponse>;
  chatStream(prompt: string, systemPrompt?: string): AsyncIterable<string>;
}

export type ProviderConstructor = new (config: BillyConfig) => ChatProvider;
