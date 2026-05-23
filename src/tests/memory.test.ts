import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { Billy } from "../agent.js";
import type { ChatProvider } from "../providers/types.js";
import type { BillyConfig, BillyResponse } from "../types.js";

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

class MemoryMockProvider implements ChatProvider {
  private step = 0;
  async chat(_prompt: string): Promise<BillyResponse> {
    this.step++;
    const content =
      this.step === 1
        ? "¡Hola! ¿Cómo estás?"
        : "Me alegra. ¿En qué más puedo ayudarte?";
    return { content, raw: content };
  }
  async *chatStream(): AsyncIterable<string> {
    yield "mock";
  }
}

// biome-ignore lint/suspicious/noExplicitAny: test access to private members
function makeIA(config: BillyConfig = {}): any {
  // biome-ignore lint/suspicious/noExplicitAny: test access to private members
  const IA = new Billy(config) as any;
  IA.client.provider = new MemoryMockProvider();
  return IA;
}

describe("Billy.memory", () => {
  it("sin memory config no guarda historial", async () => {
    const IA = makeIA();
    await IA.create("Hola");
    assert.equal(IA._memory.length, 0);
  });

  it("memory: 1 guarda user + assistant", async () => {
    const IA = makeIA({ memory: 1 });
    await IA.create("Hola");
    assert.equal(IA._memory.length, 2);
    assert.equal(IA._memory[0].role, "user");
    assert.equal(IA._memory[0].content, "Hola");
  });

  it("memory acumula múltiples turnos", async () => {
    const IA = makeIA({ memory: 5 });
    await IA.create("Hola");
    await IA.create("¿Cómo estás?");
    assert.equal(IA._memory.length, 4);
  });

  it("memory respeta límite", async () => {
    const IA = makeIA({ memory: 1 });
    await IA.create("Turno 1");
    await IA.create("Turno 2");
    assert.equal(IA._memory.length, 2);
    assert.equal(IA._memory[0].content, "Turno 2");
  });

  it("clearMemory() resetea", async () => {
    const IA = makeIA({ memory: 5 });
    await IA.create("Hola");
    IA.clearMemory();
    assert.equal(IA._memory.length, 0);
  });

  it("memory getter expone historial", async () => {
    const IA = makeIA({ memory: 5 });
    await IA.create("Hola");
    assert.equal(IA.memory.length, 2);
  });
});
