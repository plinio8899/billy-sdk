import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { Billy, SchemaValidationError } from "../agent.js";
import { schemaToPrompt, validateSchema } from "../schema.js";
import type { SchemaDef } from "../types.js";

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

const s = <T>(v: T): T => v;

describe("validateSchema", () => {
  it("valida string correcto", () => {
    assert.deepEqual(validateSchema("hola", s("string")), []);
  });

  it("rechaza string incorrecto", () => {
    const errors = validateSchema(42, s("string"));
    assert.equal(errors.length, 1);
    assert.match(errors[0], /expected string/);
  });

  it("valida number correcto", () => {
    assert.deepEqual(validateSchema(42, s("number")), []);
  });

  it("rechaza number incorrecto", () => {
    const errors = validateSchema("42", s("number"));
    assert.equal(errors.length, 1);
    assert.match(errors[0], /expected number/);
  });

  it("valida boolean correcto", () => {
    assert.deepEqual(validateSchema(true, s("boolean")), []);
  });

  it("rechaza boolean incorrecto", () => {
    const errors = validateSchema("true", s("boolean"));
    assert.equal(errors.length, 1);
    assert.match(errors[0], /expected boolean/);
  });

  it("valida array de strings", () => {
    assert.deepEqual(validateSchema(["a", "b"], s(["string"])), []);
  });

  it("rechaza array con elemento incorrecto", () => {
    const errors = validateSchema(["a", 42], s(["string"]));
    assert.equal(errors.length, 1);
    assert.match(errors[0], /\[\d+\].*expected string/);
  });

  it("rechaza no-array cuando se espera array", () => {
    const errors = validateSchema("not-array", s(["string"]));
    assert.equal(errors.length, 1);
    assert.match(errors[0], /expected array/);
  });

  it("valida objeto anidado", () => {
    const value = { name: "Juan", age: 30 };
    const schema: SchemaDef = { name: "string", age: "number" };
    assert.deepEqual(validateSchema(value, schema), []);
  });

  it("detecta campos faltantes en objeto", () => {
    const value = { name: "Juan" };
    const schema: SchemaDef = { name: "string", age: "number" };
    const errors = validateSchema(value, schema);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /age.*missing/);
  });

  it("rechaza no-objeto cuando se espera objeto", () => {
    const schema: SchemaDef = { name: "string" };
    const errors = validateSchema("texto", schema);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /expected object/);
  });

  it("valida arrays y objetos en profundidad", () => {
    const value = { tags: ["a", "b"], meta: { views: 5 } };
    const schema: SchemaDef = {
      tags: ["string"],
      meta: { views: "number" },
    };
    assert.deepEqual(validateSchema(value, schema), []);
  });
});

describe("schemaToPrompt", () => {
  it("convierte schema simple a string", () => {
    assert.equal(schemaToPrompt("string"), "string");
    assert.equal(schemaToPrompt("number"), "number");
    assert.equal(schemaToPrompt("boolean"), "boolean");
  });

  it("convierte array schema", () => {
    assert.equal(schemaToPrompt(["string"]), "[string]");
    assert.equal(schemaToPrompt(["number"]), "[number]");
  });

  it("convierte objeto schema", () => {
    const result = schemaToPrompt({ name: "string", age: "number" });
    assert.match(result, /"name"/);
    assert.match(result, /"age"/);
    assert.match(result, /string/);
    assert.match(result, /number/);
  });

  it("convierte schema anidado", () => {
    const result = schemaToPrompt({
      user: { name: "string" },
      tags: ["string"],
    });
    assert.match(result, /"user"/);
    assert.match(result, /"tags"/);
    assert.match(result, /\[string\]/);
  });

  it("maneja objeto vacío", () => {
    assert.equal(schemaToPrompt({}), "{}");
  });
});

describe("Billy.schema", () => {
  it("schema() es encadenable", () => {
    const agent = new Billy();
    assert.equal(agent.schema({ name: "string" }), agent);
  });

  it("SchemaValidationError tiene la estructura correcta", () => {
    const error = new SchemaValidationError(
      "test error",
      ["field: error"],
      '{"bad": "data"}',
    );
    assert.equal(error.name, "SchemaValidationError");
    assert.equal(error.message, "test error");
    assert.deepEqual(error.errors, ["field: error"]);
    assert.equal(error.raw, '{"bad": "data"}');
  });
});
