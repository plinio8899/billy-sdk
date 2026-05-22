export type ProviderType = "groq" | "openai" | "anthropic";

export interface BillyConfig {
  provider?: ProviderType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  systemPrompt?: string;
}

export interface BillyResponse {
  content: string;
  raw: string;
  error?: string;
}

export type Variables = Record<string, unknown>;

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

export interface BillyOptions {
  as?: ReturnType;
  length?: ResponseLength;
}

export interface BillyStream extends AsyncIterable<string> {
  then?: never;
}
