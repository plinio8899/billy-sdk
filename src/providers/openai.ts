import { createRequire } from "node:module";
import { resolveApiKey } from "../config.js";
import type { BillyConfig } from "../types.js";
import { BaseProvider } from "./base.js";

const require = createRequire(import.meta.url);

type Message = { role: "system" | "user"; content: string };

export class OpenAIProvider extends BaseProvider {
  // biome-ignore lint/suspicious/noExplicitAny: optional SDK dependency
  private client: any;

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

  // biome-ignore lint/suspicious/noExplicitAny: optional SDK dependency
  private loadClient(apiKey: string): any {
    try {
      const OpenAI = require("openai");
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

  protected buildMessages(prompt: string, systemPrompt?: string): Message[] {
    const messages: Message[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });
    return messages;
  }

  protected async completion(
    messages: Message[],
    _systemPrompt: string | undefined,
    signal: AbortSignal,
  ): Promise<{ content: string }> {
    const response = await this.client.chat.completions.create(
      {
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      },
      // biome-ignore lint/suspicious/noExplicitAny: AbortSignal type mismatch
      { signal: signal as any },
    );
    return { content: response.choices[0]?.message?.content || "" };
  }

  protected async *streamCompletion(
    messages: Message[],
    _systemPrompt: string | undefined,
    signal: AbortSignal,
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create(
      {
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: true,
      },
      // biome-ignore lint/suspicious/noExplicitAny: AbortSignal type mismatch
      { signal: signal as any },
    );

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) yield content;
    }
  }
}
