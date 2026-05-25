import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Billy } from "../agent.js";
import type { ChatProvider } from "../providers/types.js";
import type { BillyConfig, BillyOptions, BillyResponse } from "../types.js";

class MemoryMockProvider implements ChatProvider {
  private step = 0;
  async chat(
    _prompt: string,
    _systemPrompt?: string,
    _options?: BillyOptions,
  ): Promise<BillyResponse> {
    this.step++;
    const content =
      this.step === 1
        ? "¡Hola! ¿Cómo estás?"
        : "Me alegra. ¿En qué más puedo ayudarte?";
    return { content };
  }
  async *chatStream(
    _prompt: string,
    _systemPrompt?: string,
    _options?: BillyOptions,
  ): AsyncIterable<string> {
    yield "mock";
  }
}

// biome-ignore lint/suspicious/noExplicitAny: test access to private members
function makeIA(config: BillyConfig = {}): any {
  const IA = new Billy(config);
  return IA;
}

describe("Billy.memory", () => {
  it("sin memory config no guarda historial", async () => {
    const IA = makeIA({ providerInstance: new MemoryMockProvider() });
    await IA.create("Hola");
    assert.equal(IA._memory.length, 0);
  });

  it("memory: 1 guarda user + assistant", async () => {
    const IA = makeIA({
      memory: 1,
      providerInstance: new MemoryMockProvider(),
    });
    await IA.create("Hola");
    assert.equal(IA._memory.length, 2);
    assert.equal(IA._memory[0].role, "user");
    assert.equal(IA._memory[0].content, "Hola");
  });

  it("memory acumula múltiples turnos", async () => {
    const IA = makeIA({
      memory: 5,
      providerInstance: new MemoryMockProvider(),
    });
    await IA.create("Hola");
    await IA.create("¿Cómo estás?");
    assert.equal(IA._memory.length, 4);
  });

  it("memory respeta límite", async () => {
    const IA = makeIA({
      memory: 1,
      providerInstance: new MemoryMockProvider(),
    });
    await IA.create("Turno 1");
    await IA.create("Turno 2");
    assert.equal(IA._memory.length, 2);
    assert.equal(IA._memory[0].content, "Turno 2");
  });

  it("clearMemory() resetea", async () => {
    const IA = makeIA({
      memory: 5,
      providerInstance: new MemoryMockProvider(),
    });
    await IA.create("Hola");
    IA.clearMemory();
    assert.equal(IA._memory.length, 0);
  });

  it("memory getter expone historial", async () => {
    const IA = makeIA({
      memory: 5,
      providerInstance: new MemoryMockProvider(),
    });
    await IA.create("Hola");
    assert.equal(IA.memory.length, 2);
  });
});
