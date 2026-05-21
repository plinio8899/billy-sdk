import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { Billy } from "../agent.js";

const ORIGINAL_KEY = process.env.GROQ_API_KEY;

before(() => {
  process.env.GROQ_API_KEY = "test-key-123";
});

after(() => {
  if (ORIGINAL_KEY) {
    process.env.GROQ_API_KEY = ORIGINAL_KEY;
  } else {
    delete process.env.GROQ_API_KEY;
  }
});

describe("Billy", () => {
  it("se inicializa sin config", () => {
    const agent = new Billy();
    assert.ok(agent instanceof Billy);
  });

  it("se inicializa con configuración", () => {
    const agent = new Billy({ model: "mixtral-8x7b-32768", temperature: 0.5 });
    assert.ok(agent instanceof Billy);
  });

  it("métodos encadenables asType retornan la instancia", () => {
    const agent = new Billy();
    assert.equal(agent.asNumber(), agent);
    assert.equal(agent.asString(), agent);
    assert.equal(agent.asBoolean(), agent);
    assert.equal(agent.asArray(), agent);
    assert.equal(agent.asObject(), agent);
    assert.equal(agent.asJson(), agent);
  });

  it("métodos encadenables de length retornan la instancia", () => {
    const agent = new Billy();
    assert.equal(agent.short(), agent);
    assert.equal(agent.medium(), agent);
    assert.equal(agent.long(), agent);
  });

  it("se inicializa con provider explícito", () => {
    const agent = new Billy({ provider: "groq", apiKey: "test" });
    assert.ok(agent instanceof Billy);
  });

  it("lanza error con provider desconocido", () => {
    assert.throws(() => {
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid provider
      new Billy({ provider: "unknown" as any, apiKey: "test" });
    }, /Unknown provider/);
  });

  it("getters devuelven undefined inicialmente", () => {
    const agent = new Billy();
    assert.equal(agent.results, undefined);
    assert.equal(agent.raw, "");
    assert.equal(agent.error, undefined);
  });

  it("then() resuelve con results si existe", async () => {
    const agent = new Billy();
    Reflect.set(agent, "_results", "valor-test");
    const result = await agent.then();
    assert.equal(result, "valor-test");
  });

  it("then() rechaza si hay error", async () => {
    const agent = new Billy();
    Reflect.set(agent, "_error", "error-test");
    await assert.rejects(() => agent.then());
  });
});
