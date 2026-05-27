import { LlmClient } from "./client.js";
import { parseAs, parseResponse } from "./parser.js";
import { schemaToPrompt, validateSchema } from "./schema.js";
import type {
  BillyConfig,
  BillyOptions,
  BillyResponse,
  BillyStream,
  CostInfo,
  FileContent,
  InferReturn,
  ResponseLength,
  ReturnType,
  SchemaDef,
  TaskFunction,
  ToolDefinition,
  ToolHandler,
  ToolSchema,
} from "./types.js";

type MemoryMessage = { role: "user" | "assistant"; content: string };

export class Billy<T = unknown> {
  private client: LlmClient;
  private _results: unknown = undefined;
  private _raw: string = "";
  private _error: string | undefined = undefined;
  private _returnType: ReturnType | undefined = undefined;
  private _length: ResponseLength | undefined = undefined;
  private _systemPrompt: string | undefined = undefined;
  private _schema: SchemaDef | undefined = undefined;
  private _memory: MemoryMessage[] = [];
  private _memoryMax: number = 0;
  private _memoryTtl: number = 0;
  private _memoryTimestamp: number = 0;
  private _files: FileContent[] = [];
  private _tools: ToolDefinition[] = [];
  private _usageHistory: CostInfo[] = [];

  constructor(config: BillyConfig = {}) {
    this.client = new LlmClient(config);
    this._memoryMax = config.memory || 0;
    this._memoryTtl = config.memoryTtl || 0;
  }

  async create(
    prompt: string,
    options?: BillyOptions,
  ): Promise<InferReturn<T>> {
    return this.run("create", prompt, options) as Promise<InferReturn<T>>;
  }

  async modify(
    prompt: string,
    options?: BillyOptions,
  ): Promise<InferReturn<T>> {
    return this.run("modify", prompt, options) as Promise<InferReturn<T>>;
  }

  async validate(
    prompt: string,
    options?: BillyOptions,
  ): Promise<InferReturn<T>> {
    return this.run("validate", prompt, options) as Promise<InferReturn<T>>;
  }

  async analyze(
    prompt: string,
    options?: BillyOptions,
  ): Promise<InferReturn<T>> {
    return this.run("analyze", prompt, options) as Promise<InferReturn<T>>;
  }

  async extract(
    prompt: string,
    options?: BillyOptions,
  ): Promise<InferReturn<T>> {
    return this.run("extract", prompt, options) as Promise<InferReturn<T>>;
  }

  async execute(
    prompt: string,
    options?: BillyOptions,
  ): Promise<InferReturn<T>> {
    return this.run("execute", prompt, options) as Promise<InferReturn<T>>;
  }

  private checkMemoryTtl(): void {
    if (
      this._memoryTtl > 0 &&
      this._memory.length > 0 &&
      Date.now() - this._memoryTimestamp > this._memoryTtl
    ) {
      this._memory = [];
      this._memoryTimestamp = 0;
    }
  }

  private buildMemoryPrompt(currentPrompt: string): string {
    this.checkMemoryTtl();
    if (this._memory.length === 0) return currentPrompt;

    const history = this._memory
      .slice(-this._memoryMax * 2)
      .map(
        (m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`,
      )
      .join("\n");

    return `Historial de la conversación:\n${history}\n\n---\n\n${currentPrompt}`;
  }

  private addToMemory(role: "user" | "assistant", content: string): void {
    if (this._memory.length === 0) {
      this._memoryTimestamp = Date.now();
    }

    this._memory.push({ role, content });

    const maxEntries = this._memoryMax * 2;
    if (this._memory.length > maxEntries) {
      this._memory = this._memory.slice(-maxEntries);
    }
  }

  private async run(
    type: TaskFunction,
    prompt: string,
    options?: BillyOptions,
  ): Promise<unknown> {
    if (options?.type) type = options.type;
    const returnType = this._returnType;
    const length = this._length;
    this._returnType = undefined;
    this._length = undefined;
    const schema = this._schema;
    this._schema = undefined;
    const files = [...this._files, ...(options?.files || [])];
    this._files = [];
    const mergedOptions: BillyOptions | undefined =
      files.length > 0 ? { ...options, files } : options;

    if (type === "modify" && this._results !== undefined) {
      const serialized =
        typeof this._results === "object"
          ? JSON.stringify(this._results, null, 2)
          : String(this._results);
      prompt = `${serialized}\n\n---\n\n${prompt}`;
    }

    const memoryPrompt = this.buildMemoryPrompt(prompt);

    const fullPrompt = schema
      ? this.buildPrompt(type, memoryPrompt, returnType, length)
      : this.buildPrompt(type, memoryPrompt, returnType, length);

    const tools = this._tools.length > 0 ? this._tools : undefined;
    this._tools = [];

    const toolCalls: ToolDefinition[] = tools || [];

    let currentPrompt = fullPrompt;
    const allMessages: { role: string; content: string }[] = [];
    const maxToolIterations = 10;

    for (let iteration = 0; iteration <= maxToolIterations; iteration++) {
      const response: BillyResponse = await this.client.chat(
        currentPrompt,
        this._systemPrompt,
        {
          ...mergedOptions,
          schema,
          tools: toolCalls.length > 0 ? toolCalls : undefined,
        },
      );

      if (response.usage) {
        const cost: CostInfo = {
          ...response.usage,
          model: "",
          estimatedCost: (response.usage as { estimatedCost?: number })
            .estimatedCost,
        };
        this._usageHistory.push(cost);
      }

      if (response.error) {
        this._error = response.error;
        this._results = undefined;
        this._raw = "";
        throw new Error(response.error);
      }

      this._error = undefined;
      this._raw = response.content;

      if (
        response.toolCalls &&
        response.toolCalls.length > 0 &&
        toolCalls.length > 0
      ) {
        allMessages.push({
          role: "assistant",
          content: response.content || JSON.stringify(response.toolCalls),
        });

        for (const tc of response.toolCalls) {
          const toolDef = toolCalls.find((t) => t.name === tc.name);
          if (!toolDef) {
            allMessages.push({
              role: "user",
              content: `Tool "${tc.name}" not found. Available: ${toolCalls.map((t) => t.name).join(", ")}`,
            });
            continue;
          }
          try {
            const result = await toolDef.handler(tc.args);
            allMessages.push({
              role: "user",
              content: `Result of ${tc.name}: ${result}`,
            });
          } catch (err) {
            allMessages.push({
              role: "user",
              content: `Error executing ${tc.name}: ${(err as Error).message}`,
            });
          }
        }

        currentPrompt = allMessages
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n");
        continue;
      }

      if (schema) {
        try {
          const result = await this.resolveWithSchema(
            response.content,
            schema,
            fullPrompt,
          );
          if (this._memoryMax > 0) {
            this.addToMemory("user", prompt);
            this.addToMemory("assistant", response.content);
          }
          return result;
        } catch (err) {
          this._error = (err as Error).message;
          throw err;
        }
      }

      const parsed = parseResponse(response.content);
      this._results = returnType
        ? parseAs(returnType, response.content)
        : parsed;

      if (this._memoryMax > 0) {
        this.addToMemory("user", prompt);
        this.addToMemory("assistant", response.content);
      }

      return this._results;
    }

    throw new Error("Tool execution exceeded maximum iterations");
  }

  private async resolveWithSchema(
    content: string,
    schema: SchemaDef,
    originalPrompt: string,
    attempt = 1,
  ): Promise<unknown> {
    const parsed = parseAs("json", content);
    const errors = validateSchema(parsed, schema);

    if (errors.length === 0) {
      this._results = parsed;
      return parsed;
    }

    if (attempt >= 2) {
      throw new SchemaValidationError(
        `Schema validation failed:\n${errors.join("\n")}`,
        errors,
        content,
      );
    }

    const retryPrompt = `${originalPrompt}\n\nTu respuesta anterior no cumplió con la estructura requerida. Errores:\n${errors.join("\n")}\n\nCorrige y responde ÚNICAMENTE con JSON válido que cumpla exactamente la estructura indicada.`;

    const response = await this.client.chat(retryPrompt, this._systemPrompt);

    if (response.error) {
      throw new Error(response.error);
    }

    this._raw = response.content;
    return this.resolveWithSchema(
      response.content,
      schema,
      originalPrompt,
      attempt + 1,
    );
  }

  private buildPrompt(
    type: TaskFunction,
    prompt: string,
    returnType?: ReturnType,
    length?: ResponseLength,
  ): string {
    const taskInstructions: Record<TaskFunction, string> = {
      create: `Genera contenido nuevo basándote en la siguiente solicitud:`,
      modify: `Transforma o modifica el siguiente contenido según las instrucciones:`,
      validate: `Verifica o responde la siguiente pregunta:`,
      analyze: `Analiza los siguientes datos y proporciona información:`,
      extract: `Extrae la información solicitada del siguiente texto:`,
      execute: `Ejecuta el siguiente cálculo o tarea y devuelve SOLO el resultado final (sin explicación):`,
    };

    const typeInstructions: Record<string, string> = {
      number:
        "\n\nResponde ÚNICAMENTE con el número. Sin texto adicional, sin explicaciones, sin oraciones.",
      boolean:
        "\n\nResponde ÚNICAMENTE con true o false. Sin texto adicional, sin explicaciones.",
      array:
        "\n\nResponde ÚNICAMENTE con un array JSON válido. Sin markdown, sin texto adicional, sin explicaciones.",
      object:
        "\n\nResponde ÚNICAMENTE con un objeto JSON válido. Sin markdown, sin texto adicional, sin explicaciones.",
      json: "\n\nResponde ÚNICAMENTE con JSON válido. Sin markdown, sin texto adicional, sin explicaciones.",
      string: "",
    };

    const lengthInstructions: Record<ResponseLength, string> = {
      short:
        "\n\nResponde de manera MUY BREVE. Solo lo esencial. Una o dos palabras o una frase corta.",
      medium:
        "\n\nResponde de manera breve y concisa. Sin información innecesaria.",
      long: "\n\nResponde de manera detallada y completa.",
    };

    const schemaInstruction = this._schema
      ? `\n\nResponde ÚNICAMENTE con un objeto JSON válido que cumpla EXACTAMENTE esta estructura:\n${schemaToPrompt(this._schema)}\n\nSin markdown, sin texto adicional, sin explicaciones.`
      : "";

    const typeInstruction = returnType
      ? typeInstructions[returnType] || ""
      : "";
    const lengthInstruction = length ? lengthInstructions[length] : "";

    return `${taskInstructions[type]}\n\n${prompt}${schemaInstruction}${typeInstruction}${lengthInstruction}`;
  }

  asString(): Billy<"string"> {
    this._returnType = "string";
    return this as unknown as Billy<"string">;
  }

  asNumber(): Billy<"number"> {
    this._returnType = "number";
    return this as unknown as Billy<"number">;
  }

  asBoolean(): Billy<"boolean"> {
    this._returnType = "boolean";
    return this as unknown as Billy<"boolean">;
  }

  asArray(): Billy<"array"> {
    this._returnType = "array";
    return this as unknown as Billy<"array">;
  }

  asObject(): Billy<"object"> {
    this._returnType = "object";
    return this as unknown as Billy<"object">;
  }

  asJson(): Billy<"json"> {
    this._returnType = "json";
    return this as unknown as Billy<"json">;
  }

  short(): Billy<T> {
    this._length = "short";
    return this;
  }

  medium(): Billy<T> {
    this._length = "medium";
    return this;
  }

  long(): Billy<T> {
    this._length = "long";
    return this;
  }

  system(prompt: string): Billy<T> {
    this._systemPrompt = prompt;
    return this;
  }

  withFile(file: FileContent | string): Billy<T> {
    if (typeof file === "string") {
      const ext = file.toLowerCase().split(".").pop();
      if (ext === "pdf") {
        this._files.push({ type: "pdf", path: file });
      } else if (
        ext === "jpg" ||
        ext === "jpeg" ||
        ext === "png" ||
        ext === "gif" ||
        ext === "webp"
      ) {
        this._files.push({ type: "image", path: file });
      } else {
        this._files.push({ type: "file", path: file });
      }
    } else {
      this._files.push(file);
    }
    return this;
  }

  withImage(path: string): Billy<T> {
    return this.withFile({ type: "image", path });
  }

  withImageUrl(url: string, detail?: "auto" | "low" | "high"): Billy<T> {
    return this.withFile(
      detail ? { type: "image-url", url, detail } : { type: "image-url", url },
    );
  }

  withPdf(path: string): Billy<T> {
    return this.withFile({ type: "pdf", path });
  }

  withText(content: string): Billy<T> {
    return this.withFile({ type: "text", content });
  }

  schema(def: SchemaDef): Billy<T> {
    this._schema = def;
    return this;
  }

  tool(name: string, schema: ToolSchema, handler: ToolHandler): Billy<T> {
    this._tools.push({ name, schema, handler });
    return this;
  }

  tools(defs: ToolDefinition[]): Billy<T> {
    this._tools.push(...defs);
    return this;
  }

  async *stream(prompt: string, options?: BillyOptions): BillyStream {
    const returnType = this._returnType;
    const length = this._length;
    const type = options?.type || "create";
    this._returnType = undefined;
    this._length = undefined;
    const schema = this._schema;
    this._schema = undefined;
    const files = [...this._files, ...(options?.files || [])];
    this._files = [];
    const tools = [...this._tools, ...(options?.tools || [])];
    this._tools = [];
    const mergedOptions: BillyOptions | undefined =
      files.length > 0 ? { ...options, files } : options;

    if (tools.length > 0) {
      const result = await this.run(type as TaskFunction, prompt, {
        ...mergedOptions,
        schema,
        tools,
      });
      const content =
        typeof result === "string" ? result : JSON.stringify(result);
      if (content) yield content;
      return;
    }

    if (type === "modify" && this._results !== undefined) {
      const serialized =
        typeof this._results === "object"
          ? JSON.stringify(this._results, null, 2)
          : String(this._results);
      prompt = `${serialized}\n\n---\n\n${prompt}`;
    }

    const memoryPrompt = this.buildMemoryPrompt(prompt);

    const fullPrompt = this.buildPrompt(type, memoryPrompt, returnType, length);

    const providerStream = this.client.chatStream(
      fullPrompt,
      this._systemPrompt,
      schema ? { ...mergedOptions, schema } : mergedOptions,
    );

    let fullContent = "";

    try {
      for await (const chunk of providerStream) {
        fullContent += chunk;
        yield chunk;
      }
    } finally {
      if (fullContent) {
        this._error = undefined;
        this._raw = fullContent;

        if (schema) {
          try {
            this._results = await this.resolveWithSchema(
              fullContent,
              schema,
              fullPrompt,
            );
          } catch (err) {
            this._error = (err as Error).message;
            // biome-ignore lint/correctness/noUnsafeFinally: propagate schema errors after stream completion
            throw err;
          }
        } else {
          const parsed = parseResponse(fullContent);
          this._results = returnType
            ? parseAs(returnType, fullContent)
            : parsed;
        }

        if (this._memoryMax > 0) {
          this.addToMemory("user", prompt);
          this.addToMemory("assistant", fullContent);
        }
      }
    }
  }

  clearMemory(): void {
    this._memory = [];
    this._memoryTimestamp = 0;
  }

  withMemory(max: number, ttl?: number): Billy<T> {
    this._memoryMax = max;
    if (ttl !== undefined) this._memoryTtl = ttl;
    return this;
  }

  get memory(): readonly MemoryMessage[] {
    return this._memory;
  }

  get results(): InferReturn<T> | undefined {
    return this._results as InferReturn<T> | undefined;
  }

  get raw(): string {
    return this._raw;
  }

  get error(): string | undefined {
    return this._error;
  }

  get usage(): CostInfo | undefined {
    return this._usageHistory[this._usageHistory.length - 1];
  }

  get usageHistory(): readonly CostInfo[] {
    return this._usageHistory;
  }
}

export class SchemaValidationError extends Error {
  constructor(
    message: string,
    readonly errors: string[],
    readonly raw: string,
  ) {
    super(message);
    this.name = "SchemaValidationError";
  }
}
