import { createRequire } from "node:module";
import { resolveApiKey } from "../config.js";
import { mimeType, readAsBase64, readAsText } from "../file-utils.js";
import type {
  BillyConfig,
  FileContent,
  SchemaDef,
  TokenUsage,
  ToolDefinition,
} from "../types.js";
import { BaseProvider, type Message } from "./base.js";

const require = createRequire(import.meta.url);

interface AnthropicChunk {
  type: string;
  delta?: { type?: string; text?: string };
  content_block?: { type: string; [key: string]: unknown };
}

interface AnthropicResponse {
  content: { type: string; text?: string; [key: string]: unknown }[];
  usage: { input_tokens: number; output_tokens: number };
}

interface AnthropicClient {
  messages: {
    create(
      params: Record<string, unknown>,
      options?: { signal?: AbortSignal },
    ): Promise<AnthropicResponse> & AsyncIterable<AnthropicChunk>;
  };
}

function buildAnthropicTools(
  tools?: ToolDefinition[],
): Record<string, unknown>[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    name: t.name,
    description: t.description || "",
    input_schema: {
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
  }));
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

  supportsNativeJson(): boolean {
    return false;
  }

  protected defaultModel(): string {
    return "claude-3-haiku-20240307";
  }

  protected async buildMessages(
    prompt: string,
    _systemPrompt?: string,
    files?: FileContent[],
  ): Promise<Message[]> {
    if (files && files.length > 0) {
      const blocks: Record<string, unknown>[] = [];
      for (const file of files) {
        if (file.type === "image") {
          blocks.push({
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType(file.path),
              data: await readAsBase64(file.path),
            },
          });
        } else if (file.type === "image-url") {
          blocks.push({
            type: "image",
            source: { type: "url", url: file.url },
          });
        } else if (file.type === "pdf") {
          blocks.push({
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: await readAsBase64(file.path),
            },
          });
        } else if (file.type === "text") {
          blocks.push({ type: "text", text: file.content });
        } else if (file.type === "file") {
          const text = await readAsText(file.path);
          blocks.push({ type: "text", text });
        }
      }
      blocks.push({ type: "text", text: prompt });
      return [{ role: "user", content: blocks }];
    }
    return [{ role: "user", content: prompt }];
  }

  protected async completion(
    messages: Message[],
    systemPrompt: string | undefined,
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
      max_tokens: this.maxTokens,
      messages,
      temperature: this.temperature,
    };

    if (systemPrompt) {
      params.system = systemPrompt;
    }

    let allTools = buildAnthropicTools(tools) || [];

    if (schema) {
      const schemaTool = {
        name: "respond",
        description: "Respond with the required JSON structure",
        input_schema: {
          type: "object",
          properties: Object.fromEntries(
            Object.entries(schemaToFlat(schema)).map(([key, val]) => [
              key,
              { type: val },
            ]),
          ),
          required: Object.keys(schemaToFlat(schema)),
        },
      };
      allTools = [schemaTool, ...allTools];
    }

    if (allTools.length > 0) {
      params.tools = allTools;
      params.tool_choice = schema
        ? { type: "tool", name: "respond" }
        : { type: "auto" };
    }

    const response = await this.client.messages.create(params, { signal });
    const resp = response as AnthropicResponse;

    let content = "";
    let toolCalls:
      | { id: string; name: string; args: Record<string, unknown> }[]
      | undefined;

    for (const block of resp.content) {
      if (block.type === "text") {
        content += block.text || "";
      } else if (block.type === "tool_use") {
        if (!toolCalls) toolCalls = [];
        toolCalls.push({
          id: block.id as string,
          name: block.name as string,
          args: JSON.parse(JSON.stringify(block.input)),
        });
      }
    }

    let usage: TokenUsage | undefined;
    if (resp.usage) {
      usage = {
        promptTokens: resp.usage.input_tokens,
        completionTokens: resp.usage.output_tokens,
        totalTokens: resp.usage.input_tokens + resp.usage.output_tokens,
      };
    }

    return { content, usage, toolCalls };
  }

  protected async *streamCompletion(
    messages: Message[],
    systemPrompt: string | undefined,
    signal: AbortSignal,
    schema?: SchemaDef,
    tools?: ToolDefinition[],
  ): AsyncIterable<string> {
    const params: Record<string, unknown> = {
      model: this.model,
      max_tokens: this.maxTokens,
      messages,
      temperature: this.temperature,
      stream: true,
    };

    if (systemPrompt) {
      params.system = systemPrompt;
    }

    const allTools = buildAnthropicTools(tools) || [];
    if (schema) {
      const schemaTool = {
        name: "respond",
        description: "Respond with the required JSON structure",
        input_schema: {
          type: "object",
          properties: Object.fromEntries(
            Object.entries(schemaToFlat(schema)).map(([key, val]) => [
              key,
              { type: val },
            ]),
          ),
          required: Object.keys(schemaToFlat(schema)),
        },
      };
      allTools.unshift(schemaTool);
    }

    if (allTools.length > 0) {
      params.tools = allTools;
      if (schema) params.tool_choice = { type: "tool", name: "respond" };
    }

    const stream = this.client.messages.create(params, { signal });

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

function schemaToFlat(schema: SchemaDef, prefix = ""): Record<string, string> {
  if (typeof schema === "string") {
    return { [prefix || "value"]: schema };
  }
  if (Array.isArray(schema)) {
    const inner = typeof schema[0] === "string" ? schema[0] : "string";
    return { [prefix || "items"]: `array<${inner}>` };
  }
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(schema)) {
    const flat = schemaToFlat(val, key);
    Object.assign(result, flat);
  }
  return result;
}
