import { extractPdfText, mimeType, readAsBase64 } from "../file-utils.js";
import type { FileContent } from "../types.js";
import { BaseProvider, type Message } from "./base.js";

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

  protected async buildMessages(
    prompt: string,
    systemPrompt?: string,
    files?: FileContent[],
  ): Promise<Message[]> {
    const messages: Message[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });

    if (files && files.length > 0) {
      const parts: Record<string, unknown>[] = [];
      for (const file of files) {
        if (file.type === "image") {
          const b64 = await readAsBase64(file.path);
          parts.push({
            type: "image_url",
            image_url: {
              url: `data:${mimeType(file.path)};base64,${b64}`,
            },
          });
        } else if (file.type === "image-url") {
          parts.push({
            type: "image_url",
            image_url: { url: file.url, detail: file.detail ?? "auto" },
          });
        } else if (file.type === "pdf") {
          const text = await extractPdfText(file.path);
          parts.push({ type: "text", text });
        } else if (file.type === "text") {
          parts.push({ type: "text", text: file.content });
        }
      }
      parts.push({ type: "text", text: prompt });
      messages.push({ role: "user", content: parts });
    } else {
      messages.push({ role: "user", content: prompt });
    }

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
