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

  it("system() es encadenable y retorna la instancia", () => {
    const agent = new Billy();
    assert.equal(agent.system("eres un experto"), agent);
  });

  it("system() setea el system prompt vía método", () => {
    const agent = new Billy();
    agent.system("eres un historiador");
    assert.equal(Reflect.get(agent, "_systemPrompt"), "eres un historiador");
  });

  it("acepta systemPrompt en la configuración inicial", () => {
    const agent = new Billy({ systemPrompt: "eres un experto" });
    assert.equal(Reflect.get(agent, "_systemPrompt"), undefined);
  });

  it("schema() setea el schema internamente", () => {
    const agent = new Billy();
    const schemaDef = { name: "string", age: "number" } as const;
    agent.schema(schemaDef);
    assert.equal(Reflect.get(agent, "_schema"), schemaDef);
  });
});
