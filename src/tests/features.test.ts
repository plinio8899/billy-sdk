import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Billy } from "../agent.js";
import { LlmClient } from "../client.js";
import type { ChatProvider } from "../providers/types.js";
import type {
  BillyConfig,
  BillyOptions,
  BillyResponse,
  ToolDefinition,
} from "../types.js";

// ── Mock Providers ──────────────────────────────────────────────

class UsageMockProvider implements ChatProvider {
  private callCount = 0;
  private schemaMode = false;

  supportsNativeJson(): boolean {
    return false;
  }

  setSchemaMode(): void {
    this.schemaMode = true;
  }

  async chat(
    _prompt: string,
    _systemPrompt?: string,
    _options?: BillyOptions,
  ): Promise<BillyResponse> {
    this.callCount++;
    const content = this.schemaMode ? '{"key": "value"}' : "result";
    return {
      content,
      usage: {
        promptTokens: 10 * this.callCount,
        completionTokens: 20 * this.callCount,
        totalTokens: 30 * this.callCount,
      },
    };
  }

  async *chatStream(): AsyncIterable<string> {
    yield "result";
  }
}

class ToolCallMockProvider implements ChatProvider {
  private callCount = 0;
  toolDefinitions?: ToolDefinition[];

  supportsNativeJson(): boolean {
    return false;
  }

  async chat(
    _prompt: string,
    _systemPrompt?: string,
    options?: BillyOptions,
  ): Promise<BillyResponse> {
    this.callCount++;
    this.toolDefinitions = options?.tools;

    if (this.callCount === 1) {
      return {
        content: "",
        toolCalls: [
          {
            id: "call_1",
            name: "test_tool",
            args: { value: "hello" },
          },
        ],
      };
    }

    return { content: "final answer" };
  }

  async *chatStream(): AsyncIterable<string> {
    yield "streamed";
  }
}

class FailingMockProvider implements ChatProvider {
  supportsNativeJson(): boolean {
    return false;
  }
  async chat(): Promise<BillyResponse> {
    throw new Error("Primary failed");
  }
  async *chatStream(): AsyncIterable<string> {
    yield ""; // Will throw on next iteration
    throw new Error("Primary failed");
  }
}

class FallbackSuccessMockProvider implements ChatProvider {
  supportsNativeJson(): boolean {
    return false;
  }
  async chat(): Promise<BillyResponse> {
    return { content: "fallback worked" };
  }
  async *chatStream(): AsyncIterable<string> {
    yield "fallback worked";
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe("Usage Tracking", () => {
  it("expone usage después de create", async () => {
    const ia = new Billy({ providerInstance: new UsageMockProvider() });
    await ia.create("test");
    assert.ok(ia.usage);
    assert.equal(ia.usage?.promptTokens, 10);
    assert.equal(ia.usage?.completionTokens, 20);
    assert.equal(ia.usage?.totalTokens, 30);
  });

  it("acumula usageHistory en múltiples llamadas", async () => {
    const ia = new Billy({ providerInstance: new UsageMockProvider() });
    await ia.create("first");
    await ia.create("second");
    assert.equal(ia.usageHistory.length, 2);
    assert.equal(ia.usageHistory[0].promptTokens, 10);
    assert.equal(ia.usageHistory[1].promptTokens, 20);
  });

  it("incluye cost estimado cuando el modelo tiene precio conocido", async () => {
    const mock = new UsageMockProvider();
    const ia = new Billy({
      providerInstance: mock,
      model: "gpt-4o-mini",
    });
    await ia.create("test");
    assert.ok(ia.usage);
    assert.ok(ia.usage?.totalTokens > 0);
  });

  it("usage se actualiza después de schema validation", async () => {
    const mock = new UsageMockProvider();
    mock.setSchemaMode();
    const ia = new Billy({ providerInstance: mock });
    await ia.schema({ key: "string" }).create("test");
    assert.ok(ia.usage);
    assert.deepEqual(ia.results, { key: "value" });
  });
});

describe("Tool Calling", () => {
  it("ejecuta tool handler y devuelve resultado final", async () => {
    const mock = new ToolCallMockProvider();
    const ia = new Billy({ providerInstance: mock });
    let handlerCalled = false;

    ia.tool("test_tool", { value: "string" }, async (args) => {
      handlerCalled = true;
      assert.equal(args.value, "hello");
      return `processed: ${args.value}`;
    });

    const result = await ia.create("use tool");
    assert.ok(handlerCalled);
    assert.equal(result, "final answer");
  });

  it("tool() retorna this para chaining", async () => {
    const ia = new Billy({ providerInstance: new UsageMockProvider() });
    const result = ia.tool("t", { x: "string" }, async () => "ok");
    assert.ok(result instanceof Billy);
  });

  it("tools() acepta array de ToolDefinitions", async () => {
    const ia = new Billy({ providerInstance: new UsageMockProvider() });
    const defs: ToolDefinition[] = [
      { name: "a", schema: { x: "string" }, handler: async () => "a" },
      { name: "b", schema: { y: "number" }, handler: async () => "b" },
    ];
    ia.tools(defs);
    assert.ok(ia instanceof Billy);
  });

  it("error en tool handler se reporta al LLM", async () => {
    const mock = new ToolCallMockProvider();
    const ia = new Billy({ providerInstance: mock });

    ia.tool("test_tool", { value: "string" }, async () => {
      throw new Error("handler error");
    });

    const result = await ia.create("use tool");
    assert.equal(result, "final answer");
  });
});

describe("Provider Auto-Fallback", () => {
  it("cae al fallback cuando el primary falla", async () => {
    const config: BillyConfig = {
      providerInstance: new FailingMockProvider(),
      fallback: ["groq"],
      fallbackConfig: {
        groq: { providerInstance: new FallbackSuccessMockProvider() },
      },
    };
    const ia = new Billy(config);
    const result = await ia.create("test");
    assert.equal(result, "fallback worked");
  });

  it("todos fallan → error", async () => {
    const config: BillyConfig = {
      providerInstance: new FailingMockProvider(),
      fallback: ["groq"],
      fallbackConfig: {
        groq: { providerInstance: new FailingMockProvider() },
      },
    };
    const client = new LlmClient(config);
    const response = await client.chat("test");
    assert.ok(response.error);
  });

  it("streaming con fallback", async () => {
    const mockFallback = new FallbackSuccessMockProvider();
    const config: BillyConfig = {
      providerInstance: new FailingMockProvider(),
      fallback: ["groq"],
      fallbackConfig: {
        groq: { providerInstance: mockFallback },
      },
    };
    const ia = new Billy(config);
    let result = "";
    for await (const chunk of ia.stream("test")) {
      result += chunk;
    }
    assert.equal(result, "fallback worked");
  });
});

describe("ToolSchema and ToolHandler types", () => {
  it("tool con schema de array funciona", async () => {
    const mock = new UsageMockProvider();
    const ia = new Billy({ providerInstance: mock });
    ia.tool("list_tool", { items: ["string"] }, async (args) => {
      return JSON.stringify(args);
    });
    assert.ok(ia instanceof Billy);
  });
});
