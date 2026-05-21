import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import Groq from "groq-sdk";
import type { BillyConfig, BillyResponse } from "../types.js";
import type { ChatProvider } from "./types.js";

function getApiKeyFromConfig(): string | undefined {
  const configPaths = [
    "./billy-agent.config.json",
    "./.billyagentrc",
    "./.billyagentrc.json",
  ];

  for (const configPath of configPaths) {
    const fullPath = resolve(process.cwd(), configPath);
    if (existsSync(fullPath)) {
      try {
        const config = JSON.parse(readFileSync(fullPath, "utf-8"));
        if (config.apiKey) {
          return config.apiKey;
        }
      } catch {}
    }
  }
  return undefined;
}

export class GroqProvider implements ChatProvider {
  private client: Groq;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private timeout: number;
  private retries: number;

  constructor(config: BillyConfig = {}) {
    this.model = config.model || "llama-3.3-70b-versatile";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;

    const apiKey =
      config.apiKey || process.env.GROQ_API_KEY || getApiKeyFromConfig();
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY required. Get one for free at https://console.groq.com/\n" +
          "\nWays to set it:" +
          "\n  1. Set GROQ_API_KEY environment variable" +
          '\n  2. Pass apiKey in config: billy({ apiKey: "your-key" })' +
          '\n  3. Create billy-agent.config.json with { "apiKey": "your-key" }' +
          "\n  4. Run: npx billy-agent config set your-key",
      );
    }

    this.client = new Groq({ apiKey });
  }

  async chat(prompt: string): Promise<BillyResponse> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await this.client.chat.completions.create(
          {
            model: this.model,
            messages: [{ role: "user", content: prompt }],
            temperature: this.temperature,
            max_tokens: this.maxTokens,
          },
          {
            // biome-ignore lint/suspicious/noExplicitAny: AbortSignal type mismatch
            signal: controller.signal as any,
          },
        );

        clearTimeout(timeoutId);

        const content = response.choices[0]?.message?.content || "";

        return {
          content: content.trim(),
          raw: content.trim(),
        };
      } catch (error: unknown) {
        lastError = error as Error;

        if (attempt < this.retries) {
          await this.delay(1000 * attempt);
        }
      }
    }

    return {
      content: "",
      raw: "",
      error: lastError?.message || "Unknown error",
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
