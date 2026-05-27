import { Billy } from "./agent.js";
import type { BillyConfig } from "./types.js";

export type {
  BillyConfig,
  BillyOptions,
  BillyResponse,
  BillyStream,
  CostInfo,
  FileContent,
  InferReturn,
  ReturnType,
  SchemaDef,
  TaskFunction,
  TokenUsage,
  ToolCall,
  ToolDefinition,
  ToolHandler,
  ToolSchema,
} from "./types.js";
export { Billy };

export default function billy(config?: BillyConfig): Billy {
  return new Billy(config);
}
