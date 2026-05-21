import type { BillyConfig, BillyResponse } from "../types.js";

export interface ChatProvider {
  chat(prompt: string): Promise<BillyResponse>;
}

export type ProviderConstructor = new (config: BillyConfig) => ChatProvider;
