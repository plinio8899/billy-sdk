import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { Billy, SchemaValidationError } from "../agent.js";
import type { ChatProvider } from "../providers/types.js";
import type { BillyConfig, BillyOptions, BillyResponse } from "../types.js";

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

class MockProvider implements ChatProvider {
  private response: string;
  private error?: string;
  streamChunks: string[] = [];

  constructor(response: string, error?: string) {
    this.response = response;
    this.error = error;
  }

  async chat(
    _prompt: string,
    _systemPrompt?: string,
    _options?: BillyOptions,
  ): Promise<BillyResponse> {
    if (this.error) return { content: "", error: this.error };
    return { content: this.response };
  }

  async *chatStream(
    _prompt: string,
    _systemPrompt?: string,
    _options?: BillyOptions,
  ): AsyncIterable<string> {
    for (const chunk of this.streamChunks) {
      yield chunk;
    }
  }
}

function makeIA(
  response: string,
  config: BillyConfig = {},
): { ia: Billy; mock: MockProvider } {
  const mock = new MockProvider(response);
  const ia = new Billy({ ...config, providerInstance: mock });
  return { ia, mock };
}

describe("Integration — task types", () => {
  it("create devuelve string por defecto", async () => {
    const { ia } = makeIA("Hola mundo");
    const result = await ia.create("test");
    assert.equal(result, "Hola mundo");
    assert.equal(ia.raw, "Hola mundo");
    assert.equal(ia.error, undefined);
  });

  it("modify devuelve string", async () => {
    const { ia } = makeIA("texto modificado");
    const result = await ia.modify("test");
    assert.equal(result, "texto modificado");
  });

  it("validate devuelve string", async () => {
    const { ia } = makeIA("verdadero");
    const result = await ia.validate("test");
    assert.equal(result, "verdadero");
  });

  it("analyze devuelve string", async () => {
    const { ia } = makeIA("análisis completo");
    const result = await ia.analyze("test");
    assert.equal(result, "análisis completo");
  });

  it("extract devuelve string", async () => {
    const { ia } = makeIA("dato extraído");
    const result = await ia.extract("test");
    assert.equal(result, "dato extraído");
  });

  it("execute detecta número automáticamente", async () => {
    const { ia } = makeIA("42");
    const result = await ia.execute("test");
    assert.equal(result, 42);
  });
});

describe("Integration — return type coercion", () => {
  it("asNumber parsea número", async () => {
    const { ia } = makeIA("42");
    const result = await ia.asNumber().create("test");
    assert.equal(result, 42);
    assert.equal(ia.results, 42);
  });

  it("asNumber parsea número con texto", async () => {
    const { ia } = makeIA("El resultado es 3.14");
    const result = await ia.asNumber().create("test");
    assert.equal(result, 3.14);
  });

  it("asBoolean parsea true", async () => {
    const { ia } = makeIA("true");
    const result = await ia.asBoolean().create("test");
    assert.equal(result, true);
  });

  it("asBoolean parsea false", async () => {
    const { ia } = makeIA("false");
    const result = await ia.asBoolean().create("test");
    assert.equal(result, false);
  });

  it("asArray parsea array JSON", async () => {
    const { ia } = makeIA('["a", "b", "c"]');
    const result = await ia.asArray().create("test");
    assert.deepEqual(result, ["a", "b", "c"]);
  });

  it("asArray parsea lista texto", async () => {
    const { ia } = makeIA("a\nb\nc");
    const result = await ia.asArray().create("test");
    assert.deepEqual(result, ["a", "b", "c"]);
  });

  it("asObject parsea objeto", async () => {
    const { ia } = makeIA('{"nombre": "Ana", "edad": 30}');
    const result = await ia.asObject().create("test");
    assert.deepEqual(result, { nombre: "Ana", edad: 30 });
  });

  it("asJson parsea objeto", async () => {
    const { ia } = makeIA('{"key": "value"}');
    const result = await ia.asJson().create("test");
    assert.deepEqual(result, { key: "value" });
  });

  it("asString devuelve texto sin cambios", async () => {
    const { ia } = makeIA("texto plano");
    const result = await ia.asString().create("test");
    assert.equal(result, "texto plano");
  });
});

describe("Integration — return type via BillyOptions", () => {
  it("{ as: 'number' } en segunda posición", async () => {
    const { ia } = makeIA("99");
    const result = await ia.create("test", { as: "number" });
    assert.equal(result, 99);
  });

  it("{ as: 'boolean' } en segunda posición", async () => {
    const { ia } = makeIA("true");
    const result = await ia.create("test", { as: "boolean" });
    assert.equal(result, true);
  });

  it("{ as: 'array' } en segunda posición", async () => {
    const { ia } = makeIA('["x", "y"]');
    const result = await ia.create("test", { as: "array" });
    assert.deepEqual(result, ["x", "y"]);
  });
});

describe("Integration — variable resolution", () => {
  it("reemplaza {{variable}} en el prompt", async () => {
    const { ia } = makeIA("resultado");
    const result = await ia.create("Hola {{nombre}}", { nombre: "Mundo" });
    assert.equal(result, "resultado");
  });

  it("serializa objetos como JSON", async () => {
    const { ia } = makeIA("ok");
    const result = await ia.create("procesa {{data}}", { data: { x: 1 } });
    assert.equal(result, "ok");
  });

  it("variables vacías no alteran el prompt", async () => {
    const { ia } = makeIA("resultado");
    const result = await ia.create("test", {});
    assert.equal(result, "resultado");
  });

  it("sin variables funciona igual", async () => {
    const { ia } = makeIA("resultado");
    const result = await ia.create("test");
    assert.equal(result, "resultado");
  });
});

describe("Integration — schema validation", () => {
  it("schema válido retorna objeto parseado", async () => {
    const { ia } = makeIA('{"name": "Ana", "age": 30}');
    const result = await ia
      .schema({ name: "string", age: "number" })
      .create("test");
    assert.deepEqual(result, { name: "Ana", age: 30 });
  });

  it("schema falla con SchemaValidationError tras 2 intentos", async () => {
    const { ia } = makeIA("texto no JSON");
    try {
      await ia.schema({ name: "string" }).create("test");
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(err instanceof SchemaValidationError);
      assert.equal(err.name, "SchemaValidationError");
      assert.ok(err.errors.length > 0);
    }
  });
});

describe("Integration — error handling", () => {
  it("lanza error si provider retorna error", async () => {
    const mock = new MockProvider("", "API error");
    const ia = new Billy({ providerInstance: mock });
    await assert.rejects(() => ia.create("test"), /API error/);
  });

  it("getter error se setea después de error", async () => {
    const mock = new MockProvider("", "falló");
    const ia = new Billy({ providerInstance: mock });
    try {
      await ia.create("test");
    } catch {
      assert.equal(ia.error, "falló");
      assert.equal(ia.results, undefined);
      assert.equal(ia.raw, "");
    }
  });
});

describe("Integration — streaming", () => {
  it("stream entrega chunks del provider", async () => {
    const { ia, mock } = makeIA("completo");
    mock.streamChunks = ["Hello", " ", "World"];
    let result = "";
    for await (const chunk of ia.stream("test")) {
      result += chunk;
    }
    assert.equal(result, "Hello World");
  });

  it("stream con schema valida al finalizar", async () => {
    const { ia, mock } = makeIA("");
    mock.streamChunks = ['{"key": "value"}'];
    let result = "";
    for await (const chunk of ia.schema({ key: "string" }).stream("test")) {
      result += chunk;
    }
    assert.equal(result, '{"key": "value"}');
    assert.deepEqual(ia.results, { key: "value" });
  });

  it("stream vacío produce string vacío", async () => {
    const { ia } = makeIA("");
    let result = "";
    for await (const chunk of ia.stream("test")) {
      result += chunk;
    }
    assert.equal(result, "");
  });

  it("stream con type option", async () => {
    const { ia, mock } = makeIA("");
    mock.streamChunks = ["result"];
    let result = "";
    for await (const chunk of ia.stream("test", { type: "extract" })) {
      result += chunk;
    }
    assert.equal(result, "result");
  });
});

describe("Integration — memory with real calls", () => {
  it("acumula memoria en llamadas sucesivas", async () => {
    const { ia } = makeIA("respuesta", { memory: 5 });
    await ia.create("Hola");
    await ia.create("¿Cómo estás?");
    assert.equal(ia.memory.length, 4);
    assert.equal(ia.memory[0].role, "user");
    assert.equal(ia.memory[1].role, "assistant");
  });

  it("no guarda memoria si memory = 0", async () => {
    const { ia } = makeIA("respuesta");
    await ia.create("Hola");
    assert.equal(ia.memory.length, 0);
  });
});

describe("Integration — chaining reset", () => {
  it("asNumber se resetea tras create", async () => {
    const { ia } = makeIA("texto");
    await ia.asNumber().create("test");
    const result = await ia.create("test");
    assert.equal(typeof result, "string");
  });

  it("length se resetea tras create", async () => {
    const { ia } = makeIA("texto");
    await ia.short().create("test");
    const result = await ia.create("test");
    assert.equal(typeof result, "string");
  });
});

describe("Integration — detect automatic types", () => {
  it("detecta número automáticamente", async () => {
    const { ia } = makeIA("42");
    const result = await ia.create("test");
    assert.equal(result, 42);
  });

  it("detecta booleano automáticamente", async () => {
    const { ia } = makeIA("true");
    const result = await ia.create("test");
    assert.equal(result, true);
  });

  it("detecta JSON array automáticamente", async () => {
    const { ia } = makeIA('["a"]');
    const result = await ia.create("test");
    assert.deepEqual(result, ["a"]);
  });

  it("detecta JSON object automáticamente", async () => {
    const { ia } = makeIA('{"k": "v"}');
    const result = await ia.create("test");
    assert.deepEqual(result, { k: "v" });
  });
});

describe("Integration — edge cases", () => {
  it("respuesta vacía retorna string vacío", async () => {
    const { ia } = makeIA("");
    const result = await ia.create("test");
    assert.equal(result, "");
  });

  it("system prompt se pasa al provider", async () => {
    const mock = new MockProvider("respuesta");
    const ia = new Billy({ providerInstance: mock, systemPrompt: "sistema" });
    const result = await ia.create("test");
    assert.equal(result, "respuesta");
  });

  it("parseArgs identifica Options correctamente", async () => {
    const { ia } = makeIA("42");
    const result = await ia.create("test", { as: "number", length: "short" });
    assert.equal(result, 42);
  });

  it("parseArgs trata cualquier key de option como Options", async () => {
    const { ia } = makeIA("texto");
    const result = await ia.create("test", { as: "not-a-valid-type" });
    assert.equal(result, "texto");
  });

  it("parseArgs detecta temperature como key de option", async () => {
    const { ia } = makeIA("42");
    const result = await ia.create("test", { temperature: 0.2 });
    assert.equal(result, 42);
  });

  it("parseArgs detecta maxTokens como key de option", async () => {
    const { ia } = makeIA("42");
    const result = await ia.create("test", { maxTokens: 200 });
    assert.equal(result, 42);
  });

  it("parseArgs keys mixtas se tratan como Variables", async () => {
    const { ia } = makeIA("texto con variable y 123");
    const result = await ia.create("texto con {{as}} y {{extra}}", {
      as: "variable",
      extra: 123,
    });
    assert.equal(result, "texto con variable y 123");
  });
});

describe("Integration — withMemory() chainer", () => {
  it("withMemory() habilita memoria mid-flight", async () => {
    const { ia } = makeIA("respuesta");
    ia.withMemory(5);
    await ia.create("Hola");
    assert.equal(ia.memory.length, 2);
  });

  it("withMemory() sin memory inicial funciona", async () => {
    const { ia } = makeIA("ok");
    ia.withMemory(3, 60000);
    await ia.create("test");
    assert.equal(ia.memory.length, 2);
  });

  it("withMemory() retorna this para chaining", async () => {
    const { ia } = makeIA("42");
    const result = await ia.withMemory(5).asNumber().create("cuanto es 5*3");
    assert.equal(result, 42);
  });
});
