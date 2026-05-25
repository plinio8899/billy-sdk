import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  parseEnvFile,
  readApiKey,
  resolveApiKey,
  saveApiKey,
} from "../config.js";

const tmpHome = join(tmpdir(), `billy-config-test-${Date.now()}`);
const configDir = join(tmpHome, ".billy-sdk");

beforeEach(() => {
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
});

afterEach(() => {
  if (existsSync(configDir)) {
    rmSync(configDir, { recursive: true, force: true });
  }
  const envPath = join(process.cwd(), ".env.test");
  if (existsSync(envPath)) rmSync(envPath);
});

describe("parseEnvFile", () => {
  it("devuelve vacío si .env no existe", () => {
    const envPath = join(process.cwd(), ".env.nonexistent");
    if (existsSync(envPath)) rmSync(envPath);
    const result = parseEnvFile();
    assert.deepEqual(result, {});
  });

  it("parsea variables simples", () => {
    const envPath = join(tmpHome, ".env");
    writeFileSync(envPath, "GROQ_API_KEY=gsk_test\nOPENAI_API_KEY=sk-test\n");
    const originalCwd = process.cwd;
    process.cwd = () => tmpHome;
    try {
      const result = parseEnvFile();
      assert.equal(result.GROQ_API_KEY, "gsk_test");
      assert.equal(result.OPENAI_API_KEY, "sk-test");
    } finally {
      process.cwd = originalCwd;
      if (existsSync(envPath)) rmSync(envPath);
    }
  });

  it("ignora comentarios y líneas vacías", () => {
    const envPath = join(tmpHome, ".env");
    writeFileSync(envPath, "# comentario\n\nKEY=value\n");
    const originalCwd = process.cwd;
    process.cwd = () => tmpHome;
    try {
      const result = parseEnvFile();
      assert.deepEqual(result, { KEY: "value" });
    } finally {
      process.cwd = originalCwd;
      if (existsSync(envPath)) rmSync(envPath);
    }
  });

  it("limpia comillas en valores", () => {
    const envPath = join(tmpHome, ".env");
    writeFileSync(envPath, "KEY=\"quoted\"\nKEY2='single'");
    const originalCwd = process.cwd;
    process.cwd = () => tmpHome;
    try {
      const result = parseEnvFile();
      assert.equal(result.KEY, "quoted");
      assert.equal(result.KEY2, "single");
    } finally {
      process.cwd = originalCwd;
      if (existsSync(envPath)) rmSync(envPath);
    }
  });

  it("maneja valores con = en el medio", () => {
    const envPath = join(tmpHome, ".env");
    writeFileSync(envPath, "KEY=foo=bar");
    const originalCwd = process.cwd;
    process.cwd = () => tmpHome;
    try {
      const result = parseEnvFile();
      assert.equal(result.KEY, "foo=bar");
    } finally {
      process.cwd = originalCwd;
      if (existsSync(envPath)) rmSync(envPath);
    }
  });
});

describe("resolveApiKey", () => {
  const prevEnv = process.env.TEST_ENV_KEY;

  afterEach(() => {
    if (prevEnv) {
      process.env.TEST_ENV_KEY = prevEnv;
    } else {
      delete process.env.TEST_ENV_KEY;
    }
  });

  it("prioriza overrideKey sobre env var", () => {
    process.env.TEST_ENV_KEY = "from-env";
    assert.equal(resolveApiKey("from-code", "TEST_ENV_KEY"), "from-code");
  });

  it("usa env var si no hay overrideKey", () => {
    process.env.TEST_ENV_KEY = "from-env";
    assert.equal(resolveApiKey(undefined, "TEST_ENV_KEY"), "from-env");
  });

  it("retorna undefined si no hay ninguna fuente", () => {
    delete process.env.TEST_ENV_KEY;
    assert.equal(resolveApiKey(undefined, "NONEXISTENT_KEY"), undefined);
  });

  it("retorna undefined sin envVarName", () => {
    delete process.env.TEST_ENV_KEY;
    assert.equal(resolveApiKey(undefined, undefined), undefined);
  });

  it("retorna overrideKey incluso con env var presente", () => {
    process.env.TEST_ENV_KEY = "from-env";
    assert.equal(resolveApiKey("override", "TEST_ENV_KEY"), "override");
  });
});

describe("saveApiKey / readApiKey", () => {
  it("guarda y lee apiKey", () => {
    saveApiKey("gsk_test_456", tmpHome);
    assert.equal(readApiKey(tmpHome), "gsk_test_456");
  });

  it("sobrescribe apiKey existente", () => {
    saveApiKey("gsk_first", tmpHome);
    saveApiKey("gsk_second", tmpHome);
    assert.equal(readApiKey(tmpHome), "gsk_second");
  });

  it("retorna undefined si no existe archivo", () => {
    const emptyDir = join(tmpdir(), `billy-empty-${Date.now()}`);
    assert.equal(readApiKey(emptyDir), undefined);
    if (existsSync(emptyDir))
      rmSync(emptyDir, { recursive: true, force: true });
  });

  it("retorna undefined si el archivo tiene JSON inválido", () => {
    writeFileSync(join(configDir, "config.json"), "not-json");
    assert.equal(readApiKey(tmpHome), undefined);
  });

  it("crea directorio si no existe", () => {
    const newDir = join(tmpdir(), `billy-new-${Date.now()}`);
    saveApiKey("gsk_test", newDir);
    assert.equal(readApiKey(newDir), "gsk_test");
    rmSync(newDir, { recursive: true, force: true });
  });
});
