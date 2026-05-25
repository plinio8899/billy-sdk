import { createRequire } from "node:module";
import { resolveApiKey } from "../config.js";
import type { BillyConfig } from "../types.js";
import { type Client, OpenAICompatibleProvider } from "./openai-compatible.js";

const require = createRequire(import.meta.url);

export class OpenAIProvider extends OpenAICompatibleProvider {
  protected client!: Client;

  constructor(config: BillyConfig = {}) {
    super(config);
    const apiKey = resolveApiKey(config.apiKey, "OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY required.\n" +
          "Set OPENAI_API_KEY environment variable or pass apiKey in config.",
      );
    }
    this.client = this.loadClient(apiKey);
  }

  private loadClient(apiKey: string): Client {
    try {
      const OpenAI: new (config: {
        apiKey: string;
        timeout: number;
      }) => Client = require("openai");
      return new OpenAI({ apiKey, timeout: this.timeout });
    } catch {
      throw new Error(
        "openai package not found. Install it:\n  npm install openai",
      );
    }
  }

  protected defaultModel(): string {
    return "gpt-4o-mini";
  }
}
