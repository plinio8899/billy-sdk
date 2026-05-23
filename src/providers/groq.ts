import Groq from "groq-sdk";
import { resolveApiKey } from "../config.js";
import type { BillyConfig } from "../types.js";
import { BaseProvider } from "./base.js";

type Message = { role: "system" | "user"; content: string };

export class GroqProvider extends BaseProvider {
  private client: Groq;

  constructor(config: BillyConfig = {}) {
    super(config);
    const apiKey = resolveApiKey(config.apiKey, "GROQ_API_KEY");
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY required. Get one for free at https://console.groq.com/\n" +
          "\nWays to set it:" +
          "\n  1. Set GROQ_API_KEY environment variable" +
          '\n  2. Pass apiKey in config: billy({ apiKey: "your-key" })' +
          '\n  3. Create billy-sdk.config.json with { "apiKey": "your-key" }' +
          "\n  4. Run: npx billy-sdk config set your-key",
      );
    }
    this.client = new Groq({ apiKey });
  }

  protected defaultModel(): string {
    return "llama-3.3-70b-versatile";
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
