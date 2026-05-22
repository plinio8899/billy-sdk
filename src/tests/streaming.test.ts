import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("Billy.stream", () => {
  it("async generator produce chunks", async () => {
    async function* makeStream(chunks: string[]) {
      for (const chunk of chunks) {
        yield chunk;
      }
    }
    let result = "";
    for await (const chunk of makeStream(["Hello", " ", "world", "!"])) {
      result += chunk;
    }
    assert.equal(result, "Hello world!");
  });

  it("for await...of funciona con AsyncIterable", async () => {
    const stream: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        let i = 0;
        const chunks = ["a", "b", "c"];
        return {
          next() {
            if (i < chunks.length) {
              return Promise.resolve({ done: false, value: chunks[i++] });
            }
            return Promise.resolve({ done: true, value: undefined as any });
          },
        };
      },
    };
    let result = "";
    for await (const chunk of stream) {
      result += chunk;
    }
    assert.equal(result, "abc");
  });

  it("stream vacío produce string vacío", async () => {
    async function* empty() {}
    let result = "";
    for await (const chunk of empty()) {
      result += chunk;
    }
    assert.equal(result, "");
  });

  it("error en stream se propaga", async () => {
    async function* errorStream(): AsyncIterable<string> {
      yield "before";
      throw new Error("stream error");
    }
    let result = "";
    let caught = false;
    try {
      for await (const chunk of errorStream()) {
        result += chunk;
      }
    } catch (err: unknown) {
      caught = true;
      assert.equal((err as Error).message, "stream error");
    }
    assert.equal(result, "before");
    assert.equal(caught, true);
  });
});
