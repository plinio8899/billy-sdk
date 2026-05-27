export type ProviderType = "groq" | "openai" | "anthropic";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostInfo extends TokenUsage {
  estimatedCost?: number;
  model: string;
}

export interface BillyConfig {
  provider?: ProviderType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  systemPrompt?: string;
  memory?: number;
  memoryTtl?: number;
  /** @internal Used for injecting a mock provider in tests */
  providerInstance?: unknown;
  /** Ordered list of fallback providers when the primary fails */
  fallback?: ProviderType[];
  /** Per-provider config overrides for fallback providers */
  fallbackConfig?: Partial<Record<ProviderType, Partial<BillyConfig>>>;
}

export interface BillyResponse {
  content: string;
  error?: string;
  usage?: TokenUsage;
  toolCalls?: ToolCall[];
}

export type ToolSchema = Record<string, SchemaPrimitive | SchemaPrimitive[]>;

export type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

export interface ToolDefinition {
  name: string;
  description?: string;
  schema: ToolSchema;
  handler: ToolHandler;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export type TaskFunction =
  | "create"
  | "modify"
  | "validate"
  | "analyze"
  | "extract"
  | "execute";

export type ReturnType =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "json";

export type ResponseLength = "short" | "medium" | "long";

export type SchemaPrimitive = "string" | "number" | "boolean";

export type SchemaDef =
  | SchemaPrimitive
  | { [key: string]: SchemaDef }
  | [SchemaDef];

export type FileContent =
  | { type: "image"; path: string }
  | { type: "image-url"; url: string; detail?: "auto" | "low" | "high" }
  | { type: "pdf"; path: string }
  | { type: "text"; content: string }
  | { type: "file"; path: string };

export interface BillyOptions {
  type?: TaskFunction;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  files?: FileContent[];
  schema?: SchemaDef;
  tools?: ToolDefinition[];
}

export interface BillyStream extends AsyncIterable<string> {
  then?: never;
}

export type ReturnTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  array: unknown[];
  object: Record<string, unknown>;
  json: unknown;
};

export type InferReturn<T> = T extends ReturnType ? ReturnTypeMap[T] : unknown;
