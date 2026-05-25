import { createRequire } from "node:module";
import { resolveApiKey } from "../config.js";
import type { BillyConfig } from "../types.js";
import { BaseProvider } from "./base.js";

const require = createRequire(import.meta.url);

type Message = { role: "user"; content: string };

interface AnthropicChunk {
  type: string;
  delta?: { type?: string; text?: string };
}

interface AnthropicResponse {
  content: { text?: string }[];
}

interface AnthropicClient {
  messages: {
    create(
      params: {
        model: string;
        max_tokens: number;
        system?: string;
        messages: Message[];
        temperature: number;
        stream?: boolean;
      },
      options?: { signal?: AbortSignal },
    ): Promise<AnthropicResponse> & AsyncIterable<AnthropicChunk>;
  };
}

export class AnthropicProvider extends BaseProvider {
  private client!: AnthropicClient;

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

  private loadClient(apiKey: string): AnthropicClient {
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
      { signal },
    );
    return {
      content: (response as AnthropicResponse).content?.[0]?.text || "",
    };
  }

  protected async *streamCompletion(
    messages: Message[],
    systemPrompt: string | undefined,
    signal: AbortSignal,
  ): AsyncIterable<string> {
    const stream = this.client.messages.create(
      {
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt || undefined,
        messages,
        temperature: this.temperature,
        stream: true,
      },
      { signal },
    );

    for await (const chunk of stream as AsyncIterable<AnthropicChunk>) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta?.type === "text_delta"
      ) {
        if (chunk.delta.text) yield chunk.delta.text;
      }
    }
  }
}
