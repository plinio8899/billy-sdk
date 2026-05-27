import Groq from "groq-sdk";
import { resolveApiKey } from "../config.js";
import type { BillyConfig } from "../types.js";
import { type Client, OpenAICompatibleProvider } from "./openai-compatible.js";

export class GroqProvider extends OpenAICompatibleProvider {
  protected client!: Client;

  constructor(config: BillyConfig = {}) {
    super(config);
    const apiKey = resolveApiKey(config.apiKey, "GROQ_API_KEY");
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY required. Get one for free at https://console.groq.com/\n" +
          "\nWays to set it:" +
          "\n  1. Set GROQ_API_KEY environment variable" +
          '\n  2. Pass apiKey in config: billy({ apiKey: "your-key" })' +
          "\n  3. Run: npx billy-sdk config set your-key" +
          "\n     (saves to ~/.billy-sdk/config.json)",
      );
    }
    this.client = new Groq({ apiKey }) as unknown as Client;
  }

  protected defaultModel(): string {
    return "llama-3.3-70b-versatile";
  }
}
