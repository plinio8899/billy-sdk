export interface BillyConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export interface BillyResponse {
  content: string;
  raw: string;
  error?: string;
}

export type Variables = Record<string, unknown>;

export type TaskFunction = 'create' | 'modify' | 'validate' | 'analyze' | 'extract' | 'execute';

export type ReturnType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'json';

export type ResponseLength = 'short' | 'medium' | 'long';

export interface BillyOptions {
  as?: ReturnType;
  length?: ResponseLength;
}