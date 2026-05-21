import { Billy } from './agent.js';
import type { BillyConfig } from './types.js';

export { Billy };
export type { BillyConfig, Variables, TaskFunction } from './types.js';

export default function billy(config?: BillyConfig): Billy {
  return new Billy(config);
}