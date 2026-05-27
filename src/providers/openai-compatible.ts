import {
  extractPdfText,
  mimeType,
  readAsBase64,
  readAsText,
} from "../file-utils.js";
import type {
  FileContent,
  SchemaDef,
  TokenUsage,
  ToolDefinition,
} from "../types.js";
import { BaseProvider, type Message } from "./base.js";

interface CompletionChunk {
  choices: { delta?: { content?: string } }[];
}

interface CompletionResponse {
  choices: {
    message?: {
      content?: string;
      tool_calls?: {
        id: string;
        function: { name: string; arguments: string };
      }[];
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
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

function buildToolsPayload(
  tools?: ToolDefinition[],
): Record<string, unknown>[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description || "",
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          Object.entries(t.schema).map(([key, val]) => [
            key,
            {
              type: Array.isArray(val) ? "array" : val,
              items: Array.isArray(val) ? { type: val[0] } : undefined,
            },
          ]),
        ),
        required: Object.keys(t.schema),
      },
    },
  }));
}

export abstract class OpenAICompatibleProvider extends BaseProvider {
  protected abstract client: Client;

  supportsNativeJson(): boolean {
    return true;
  }

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
        } else if (file.type === "file") {
          const text = await readAsText(file.path);
          parts.push({ type: "text", text });
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
    schema?: SchemaDef,
    tools?: ToolDefinition[],
  ): Promise<{
    content: string;
    usage?: TokenUsage;
    toolCalls?: { id: string; name: string; args: Record<string, unknown> }[];
  }> {
    const params: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    };

    if (schema) {
      params.response_format = { type: "json_object" };
    }

    const toolsPayload = buildToolsPayload(tools);
    if (toolsPayload) {
      params.tools = toolsPayload;
    }

    const response = await this.client.chat.completions.create(params, {
      signal,
    });

    const resp = response as CompletionResponse;
    const message = resp.choices[0]?.message;
    const content = message?.content || "";

    let usage: TokenUsage | undefined;
    if (resp.usage) {
      usage = {
        promptTokens: resp.usage.prompt_tokens,
        completionTokens: resp.usage.completion_tokens,
        totalTokens: resp.usage.total_tokens,
      };
    }

    let toolCalls:
      | { id: string; name: string; args: Record<string, unknown> }[]
      | undefined;
    if (message?.tool_calls && message.tool_calls.length > 0) {
      toolCalls = message.tool_calls.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments),
      }));
    }

    return { content, usage, toolCalls };
  }

  protected async *streamCompletion(
    messages: Message[],
    _systemPrompt: string | undefined,
    signal: AbortSignal,
    schema?: SchemaDef,
    tools?: ToolDefinition[],
  ): AsyncIterable<string> {
    const params: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      stream: true,
    };

    if (schema) {
      params.response_format = { type: "json_object" };
    }

    const toolsPayload = buildToolsPayload(tools);
    if (toolsPayload) {
      params.tools = toolsPayload;
    }

    const stream = this.client.chat.completions.create(params, { signal });

    for await (const chunk of stream as AsyncIterable<CompletionChunk>) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) yield content;
    }
  }
}
