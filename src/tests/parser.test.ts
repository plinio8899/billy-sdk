import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAs, parseResponse } from "../parser.js";

describe("parseResponse", () => {
  it("detecta y parsea objetos JSON", () => {
    const result = parseResponse('{"nombre": "Juan", "edad": 30}');
    assert.deepEqual(result, { nombre: "Juan", edad: 30 });
  });

  it("detecta y parsea arrays JSON", () => {
    const result = parseResponse('["a", "b", "c"]');
    assert.deepEqual(result, ["a", "b", "c"]);
  });

  it("detecta números", () => {
    assert.equal(parseResponse("42"), 42);
    assert.equal(parseResponse("3.14"), 3.14);
  });

  it("detecta booleanos", () => {
    assert.equal(parseResponse("true"), true);
    assert.equal(parseResponse("false"), false);
  });

  it("devuelve string si no detecta nada", () => {
    assert.equal(parseResponse("Hola mundo"), "Hola mundo");
  });

  it("limpia prefijos comunes antes de parsear", () => {
    const result = parseResponse('Aquí tienes:\n{"clave": "valor"}');
    assert.deepEqual(result, { clave: "valor" });
  });

  it("limpia bloques markdown", () => {
    const result = parseResponse('```json\n{"a": 1}\n```');
    assert.deepEqual(result, { a: 1 });
  });
});

describe("parseAs", () => {
  it("parsea como número", () => {
    assert.equal(parseAs("number", "El resultado es 42"), 42);
    assert.equal(parseAs("number", "3.14"), 3.14);
  });

  it("parsea como booleano", () => {
    assert.equal(parseAs("boolean", "true"), true);
    assert.equal(parseAs("boolean", "yes"), true);
    assert.equal(parseAs("boolean", "false"), false);
  });

  it("parsea como array desde JSON", () => {
    const result = parseAs("array", '["x", "y"]');
    assert.deepEqual(result, ["x", "y"]);
  });

  it("parsea como array desde lista texto", () => {
    const result = parseAs("array", "a\nb\nc");
    assert.deepEqual(result, ["a", "b", "c"]);
  });

  it("parsea como objeto", () => {
    const result = parseAs("object", '{"nombre": "Ana"}');
    assert.deepEqual(result, { nombre: "Ana" });
  });

  it("parsea como JSON (objeto o array)", () => {
    assert.deepEqual(parseAs("json", '{"k": "v"}'), { k: "v" });
    assert.deepEqual(parseAs("json", "[1, 2]"), [1, 2]);
  });

  it("devuelve string sin modificar", () => {
    assert.equal(parseAs("string", "texto plano"), "texto plano");
  });

  it("parseAs number no fusiona números separados", () => {
    assert.equal(parseAs("number", "items: 3, count: 5"), 3);
    assert.equal(parseAs("number", "The result is 42 dollars"), 42);
  });

  it("parseAs number fallback a 0 si no hay números", () => {
    assert.equal(parseAs("number", "sin números aquí"), 0);
  });

  it("parseAs array con comas en texto natural no se parte", () => {
    const result = parseAs(
      "array",
      "First, let me explain, the answer is a, b, c",
    ) as string[];
    assert.equal(result.length, 1);
    assert.equal(result[0], "First, let me explain, the answer is a, b, c");
  });
});
