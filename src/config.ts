import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const CONFIG_DIR = ".billy-sdk";
const CONFIG_FILE = "config.json";

function parseEnvFile(): Record<string, string> {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return {};

  const vars: Record<string, string> = {};
  const content = readFileSync(envPath, "utf-8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }

  return vars;
}

export function getConfigPath(homeDir?: string): string {
  return resolve(homeDir || homedir(), CONFIG_DIR, CONFIG_FILE);
}

export function readApiKey(homeDir?: string): string | undefined {
  const configPath = getConfigPath(homeDir);
  if (!existsSync(configPath)) return undefined;
  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    return config.apiKey;
  } catch {
    return undefined;
  }
}

export function saveApiKey(apiKey: string, homeDir?: string): void {
  const configPath = getConfigPath(homeDir);
  const dir = resolve(homeDir || homedir(), CONFIG_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(configPath, JSON.stringify({ apiKey }, null, 2));
  try {
    chmodSync(configPath, 0o600);
  } catch {}
}

export function removeApiKey(homeDir?: string): boolean {
  const configPath = getConfigPath(homeDir);
  if (!existsSync(configPath)) return false;
  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    delete config.apiKey;
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch {
    return false;
  }
}

export function hasConfig(homeDir?: string): boolean {
  const path = getConfigPath(homeDir);
  if (!existsSync(path)) return false;
  try {
    const config = JSON.parse(readFileSync(path, "utf-8"));
    return !!config.apiKey;
  } catch {
    return false;
  }
}

export function resolveApiKey(
  overrideKey?: string,
  envVarName?: string,
): string | undefined {
  if (overrideKey) return overrideKey;

  if (envVarName && process.env[envVarName]) {
    return process.env[envVarName];
  }

  const envVars = parseEnvFile();
  if (envVarName && envVars[envVarName]) {
    return envVars[envVarName];
  }

  return readApiKey();
}
