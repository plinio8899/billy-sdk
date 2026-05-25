import { BaseProvider } from "./base.js";

type Message = { role: "system" | "user"; content: string };

interface CompletionChunk {
  choices: { delta?: { content?: string } }[];
}

interface CompletionResponse {
  choices: { message?: { content?: string } }[];
}

export interface Client {
  chat: {
    completions: {
      create(
        params: Record<string, unknown>,
        options?: { signal?: AbortSignal },
      ): Promise<CompletionResponse> & AsyncIterable<CompletionChunk>;
    };
  };
}

export abstract class OpenAICompatibleProvider extends BaseProvider {
  protected abstract client: Client;

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
      { signal },
    );
    return {
      content:
        (response as CompletionResponse).choices[0]?.message?.content || "",
    };
  }

  protected async *streamCompletion(
    messages: Message[],
    _systemPrompt: string | undefined,
    signal: AbortSignal,
  ): AsyncIterable<string> {
    const stream = this.client.chat.completions.create(
      {
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: true,
      },
      { signal },
    );

    for await (const chunk of stream as AsyncIterable<CompletionChunk>) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) yield content;
    }
  }
}
