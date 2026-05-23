import { createRequire } from "node:module";
import { resolveApiKey } from "../config.js";
import type { BillyConfig } from "../types.js";
import { BaseProvider } from "./base.js";

const require = createRequire(import.meta.url);

type Message = { role: "system" | "user"; content: string };

export class AnthropicProvider extends BaseProvider {
  // biome-ignore lint/suspicious/noExplicitAny: optional SDK dependency
  private client: any;

  constructor(config: BillyConfig = {}) {
    super(config);
    const apiKey = resolveApiKey(config.apiKey, "ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY required.\n" +
          "Set ANTHROPIC_API_KEY environment variable or pass apiKey in config.",
      );
    }
    this.client = this.loadClient(apiKey);
  }

  // biome-ignore lint/suspicious/noExplicitAny: optional SDK dependency
  private loadClient(apiKey: string): any {
    try {
      const { Anthropic } = require("@anthropic-ai/sdk");
      return new Anthropic({ apiKey, timeout: this.timeout });
    } catch {
      throw new Error(
        "@anthropic-ai/sdk package not found. Install it:\n" +
          "  npm install @anthropic-ai/sdk",
      );
    }
  }

  protected defaultModel(): string {
    return "claude-3-haiku-20240307";
  }

  protected buildMessages(prompt: string, _systemPrompt?: string): Message[] {
    return [{ role: "user", content: prompt }];
  }

  protected async completion(
    messages: Message[],
    systemPrompt: string | undefined,
    signal: AbortSignal,
  ): Promise<{ content: string }> {
    const response = await this.client.messages.create(
      {
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt || undefined,
        messages,
        temperature: this.temperature,
      },
      // biome-ignore lint/suspicious/noExplicitAny: AbortSignal type mismatch
      { signal: signal as any },
    );
    return { content: response.content?.[0]?.text || "" };
  }

  protected async *streamCompletion(
    messages: Message[],
    systemPrompt: string | undefined,
    signal: AbortSignal,
  ): AsyncIterable<string> {
    const stream = await this.client.messages.create(
      {
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt || undefined,
        messages,
        temperature: this.temperature,
        stream: true,
      },
      // biome-ignore lint/suspicious/noExplicitAny: AbortSignal type mismatch
      { signal: signal as any },
    );

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta?.type === "text_delta"
      ) {
        yield chunk.delta.text;
      }
    }
  }
}
