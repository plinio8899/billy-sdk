import assert from "node:assert/strict";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";

const configPath = join(process.cwd(), "billy-agent.config.json");

afterEach(() => {
  if (existsSync(configPath)) {
    unlinkSync(configPath);
  }
});

describe("CLI - config file", () => {
  it("crea archivo de config con apiKey", () => {
    writeFileSync(
      configPath,
      JSON.stringify({ apiKey: "test-key-123" }, null, 2),
    );
    assert.equal(existsSync(configPath), true);

    const content = JSON.parse(readFileSync(configPath, "utf-8"));
    assert.equal(content.apiKey, "test-key-123");
  });

  it("elimina apiKey del config y limpia archivo si vacío", () => {
    writeFileSync(
      configPath,
      JSON.stringify({ apiKey: "test-key-123" }, null, 2),
    );
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    delete config.apiKey;
    assert.equal(Object.keys(config).length, 0);
  });

  it("no falla si archivo no existe", () => {
    assert.equal(existsSync(configPath), false);
  });
});
