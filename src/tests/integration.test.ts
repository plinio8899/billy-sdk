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

  supportsNativeJson(): boolean {
    return false;
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

  it("schema se resetea tras create", async () => {
    let callCount = 0;
    const steppingMock = new (class extends MockProvider {
      async chat(): Promise<BillyResponse> {
        callCount++;
        return callCount === 1
          ? { content: '{"name": "test"}' }
          : { content: "texto plano" };
      }
    })("");
    const ia = new Billy({ providerInstance: steppingMock });
    await ia.schema({ name: "string" }).create("first");
    const result = await ia.create("second");
    assert.equal(result, "texto plano");
  });

  it("schema se resetea tras stream", async () => {
    let streamed = false;
    const steppingMock = new (class extends MockProvider {
      async *chatStream(): AsyncIterable<string> {
        streamed = true;
        yield '{"name": "test"}';
      }
    })("texto plano");
    const ia = new Billy({ providerInstance: steppingMock });
    for await (const _ of ia.schema({ name: "string" }).stream("test")) {
    }
    assert.ok(streamed);
    const result = await ia.create("second");
    assert.equal(result, "texto plano");
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

  it("options temperature se pasa al provider", async () => {
    const { ia } = makeIA("42");
    const result = await ia.create("test", { temperature: 0.2 });
    assert.equal(result, 42);
  });

  it("options maxTokens se pasa al provider", async () => {
    const { ia } = makeIA("42");
    const result = await ia.create("test", { maxTokens: 200 });
    assert.equal(result, 42);
  });

  it("modify usa .results como contexto", async () => {
    const { ia } = makeIA("texto modificado con contexto");
    await ia.create("contenido original");
    const result = await ia.modify("hazlo más poético");
    assert.equal(result, "texto modificado con contexto");
  });

  it("options.type sobreescribe el task type", async () => {
    const mock = new MockProvider("42");
    const ia = new Billy({ providerInstance: mock });
    const result = await ia.create("test", { type: "execute" });
    assert.equal(result, 42);
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

describe("Billy file attachment", () => {
  it("withFile con string detecta PDF por extension", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: { type: string; path: string }[];
      withFile: (f: unknown) => void;
    };
    ia.withFile("./doc.pdf");
    assert.deepEqual(ia._files, [{ type: "pdf", path: "./doc.pdf" }]);
  });

  it("withFile con string detecta imagen por extension", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: { type: string; path: string }[];
      withFile: (f: unknown) => void;
    };
    ia.withFile("./photo.jpg");
    assert.deepEqual(ia._files, [{ type: "image", path: "./photo.jpg" }]);
  });

  it("withFile con string detecta jpeg como imagen", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: { type: string; path: string }[];
      withFile: (f: unknown) => void;
    };
    ia.withFile("./photo.jpeg");
    assert.deepEqual(ia._files, [{ type: "image", path: "./photo.jpeg" }]);
  });

  it("withFile con string detecta png como imagen", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: { type: string; path: string }[];
      withFile: (f: unknown) => void;
    };
    ia.withFile("./photo.png");
    assert.deepEqual(ia._files, [{ type: "image", path: "./photo.png" }]);
  });

  it("withFile con string detecta gif como imagen", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: { type: string; path: string }[];
      withFile: (f: unknown) => void;
    };
    ia.withFile("./photo.gif");
    assert.deepEqual(ia._files, [{ type: "image", path: "./photo.gif" }]);
  });

  it("withFile con string detecta webp como imagen", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: { type: string; path: string }[];
      withFile: (f: unknown) => void;
    };
    ia.withFile("./photo.webp");
    assert.deepEqual(ia._files, [{ type: "image", path: "./photo.webp" }]);
  });

  it("withFile con string usa file para extension desconocida", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: { type: string; path: string }[];
      withFile: (f: unknown) => void;
    };
    ia.withFile("./data.csv");
    assert.deepEqual(ia._files, [{ type: "file", path: "./data.csv" }]);
  });

  it("withFile con FileContent object lo agrega directo", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: unknown[];
      withFile: (f: unknown) => void;
    };
    ia.withFile({ type: "image-url", url: "https://example.com/img.jpg" });
    assert.deepEqual(ia._files, [
      { type: "image-url", url: "https://example.com/img.jpg" },
    ]);
  });

  it("withImage es shortcut para tipo image", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: { type: string; path: string }[];
      withImage: (p: string) => void;
    };
    ia.withImage("./foto.jpg");
    assert.deepEqual(ia._files, [{ type: "image", path: "./foto.jpg" }]);
  });

  it("withPdf es shortcut para tipo pdf", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: { type: string; path: string }[];
      withPdf: (p: string) => void;
    };
    ia.withPdf("./doc.pdf");
    assert.deepEqual(ia._files, [{ type: "pdf", path: "./doc.pdf" }]);
  });

  it("withImageUrl es shortcut para tipo image-url", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: { type: string; url: string }[];
      withImageUrl: (u: string) => void;
    };
    ia.withImageUrl("https://example.com/img.jpg");
    assert.deepEqual(ia._files, [
      { type: "image-url", url: "https://example.com/img.jpg" },
    ]);
  });

  it("withText es shortcut para tipo text", () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: { type: string; content: string }[];
      withText: (c: string) => void;
    };
    ia.withText("contenido directo");
    assert.deepEqual(ia._files, [
      { type: "text", content: "contenido directo" },
    ]);
  });

  it("chained files se pasan como options.files en run()", async () => {
    let capturedOptions: BillyOptions | undefined;
    const capturingMock = new (class extends MockProvider {
      async chat(
        _prompt: string,
        _systemPrompt?: string,
        options?: BillyOptions,
      ): Promise<BillyResponse> {
        capturedOptions = options;
        return { content: "ok" };
      }
    })("");
    const ia = new Billy({ providerInstance: capturingMock });
    ia.withImage("./foto.jpg");
    await ia.create("test");
    assert.ok(capturedOptions);
    assert.deepEqual(capturedOptions?.files, [
      { type: "image", path: "./foto.jpg" },
    ]);
  });

  it("options.files directo funciona sin chaining", async () => {
    let capturedOptions: BillyOptions | undefined;
    const capturingMock = new (class extends MockProvider {
      async chat(
        _prompt: string,
        _systemPrompt?: string,
        options?: BillyOptions,
      ): Promise<BillyResponse> {
        capturedOptions = options;
        return { content: "ok" };
      }
    })("");
    const ia = new Billy({ providerInstance: capturingMock });
    await ia.create("test", {
      files: [{ type: "image", path: "./foto.jpg" }],
    });
    assert.ok(capturedOptions);
    assert.deepEqual(capturedOptions?.files, [
      { type: "image", path: "./foto.jpg" },
    ]);
  });

  it("chaining files + options.files se mergean", async () => {
    let capturedOptions: BillyOptions | undefined;
    const capturingMock = new (class extends MockProvider {
      async chat(
        _prompt: string,
        _systemPrompt?: string,
        options?: BillyOptions,
      ): Promise<BillyResponse> {
        capturedOptions = options;
        return { content: "ok" };
      }
    })("");
    const ia = new Billy({ providerInstance: capturingMock });
    ia.withFile({ type: "text", content: "extra" });
    await ia.create("test", {
      files: [{ type: "image", path: "./foto.jpg" }],
    });
    assert.ok(capturedOptions);
    assert.equal(capturedOptions?.files?.length, 2);
    assert.equal(
      (capturedOptions?.files?.[0] as { type: string }).type,
      "text",
    );
    assert.equal(
      (capturedOptions?.files?.[1] as { type: string }).type,
      "image",
    );
  });

  it("chained files se limpian tras run()", async () => {
    const ia = new Billy({
      providerInstance: new MockProvider(""),
    }) as unknown as {
      _files: unknown[];
      withImage: (p: string) => void;
      create: (p: string) => Promise<unknown>;
    };
    ia.withImage("./foto.jpg");
    await ia.create("test");
    assert.equal(ia._files.length, 0);
  });

  it("chained files funcionan con stream()", async () => {
    let capturedOptions: BillyOptions | undefined;
    const capturingMock = new (class extends MockProvider {
      streamChunks = ["a", "b"];
      async *chatStream(
        _prompt: string,
        _systemPrompt?: string,
        options?: BillyOptions,
      ): AsyncIterable<string> {
        capturedOptions = options;
        for (const chunk of this.streamChunks) {
          yield chunk;
        }
      }
    })("");
    const ia = new Billy({ providerInstance: capturingMock });
    ia.withImage("./foto.jpg");
    const chunks: string[] = [];
    for await (const chunk of ia.stream("test")) {
      chunks.push(chunk);
    }
    assert.ok(capturedOptions);
    assert.deepEqual(capturedOptions?.files, [
      { type: "image", path: "./foto.jpg" },
    ]);
    assert.deepEqual(chunks, ["a", "b"]);
  });

  it("chaining combinado: withImage + options funciona", async () => {
    const { ia } = makeIA("resultado");
    const result = await ia.withImage("./img.jpg").create("describe");
    assert.equal(result, "resultado");
  });
});
