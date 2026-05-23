import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import {
  readApiKey,
  removeApiKey,
  resolveApiKey,
  saveApiKey,
} from "../config.js";

const tmpHome = join(tmpdir(), `billy-test-${Date.now()}`);

afterEach(() => {
  const configDir = join(tmpHome, ".billy-sdk");
  if (existsSync(configDir)) {
    rmSync(configDir, { recursive: true, force: true });
  }
});

describe("CLI - config file", () => {
  it("guarda y lee apiKey en ~/.billy-sdk/config.json", () => {
    saveApiKey("gsk_test_key_123", tmpHome);
    assert.equal(readApiKey(tmpHome), "gsk_test_key_123");
  });

  it("elimina apiKey del archivo de config", () => {
    saveApiKey("gsk_test_key_123", tmpHome);
    assert.equal(readApiKey(tmpHome), "gsk_test_key_123");

    removeApiKey(tmpHome);
    assert.equal(readApiKey(tmpHome), undefined);
  });

  it("no falla si archivo no existe", () => {
    assert.equal(readApiKey(tmpHome), undefined);
    assert.equal(removeApiKey(tmpHome), false);
  });

  it("resuelve apiKey por orden de prioridad: code > env var > .env > config", () => {
    const prev = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    assert.equal(resolveApiKey("code-key", "GROQ_API_KEY"), "code-key");
    process.env.GROQ_API_KEY = "env-key";
    assert.equal(resolveApiKey(undefined, "GROQ_API_KEY"), "env-key");

    if (prev) process.env.GROQ_API_KEY = prev;
    else delete process.env.GROQ_API_KEY;
  });

  it("maskKey muestra solo primeros y últimos 4 caracteres", async () => {
    const { maskKey } = await import("../cli.js");
    assert.equal(maskKey("gsk_abc123def456"), "gsk_****f456");
    assert.equal(maskKey("short"), "shor****");
  });
});
