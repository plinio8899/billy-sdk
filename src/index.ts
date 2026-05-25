import { Billy } from "./agent.js";
import type { BillyConfig } from "./types.js";

export type { BillyConfig, FileContent, TaskFunction } from "./types.js";
export { Billy };

export default function billy(config?: BillyConfig): Billy {
  return new Billy(config);
}
