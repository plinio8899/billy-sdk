import { LlmClient } from "./client.js";
import { parseAs, parseResponse } from "./parser.js";
import { schemaToPrompt, validateSchema } from "./schema.js";
import type {
  BillyConfig,
  BillyOptions,
  BillyResponse,
  BillyStream,
  InferReturn,
  ResponseLength,
  ReturnType,
  SchemaDef,
  TaskFunction,
  Variables,
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

  constructor(config: BillyConfig = {}) {
    this.client = new LlmClient(config);
    this._memoryMax = config.memory || 0;
    this._memoryTtl = config.memoryTtl || 0;
  }

  async create(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<InferReturn<T>> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("create", prompt, vars, options) as Promise<InferReturn<T>>;
  }

  async modify(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<InferReturn<T>> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("modify", prompt, vars, options) as Promise<InferReturn<T>>;
  }

  async validate(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<InferReturn<T>> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("validate", prompt, vars, options) as Promise<
      InferReturn<T>
    >;
  }

  async analyze(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<InferReturn<T>> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("analyze", prompt, vars, options) as Promise<
      InferReturn<T>
    >;
  }

  async extract(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<InferReturn<T>> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("extract", prompt, vars, options) as Promise<
      InferReturn<T>
    >;
  }

  async execute(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<InferReturn<T>> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("execute", prompt, vars, options) as Promise<
      InferReturn<T>
    >;
  }

  private parseArgs(input?: Variables | BillyOptions): {
    vars: Variables | undefined;
    options: BillyOptions | undefined;
  } {
    if (!input) return { vars: undefined, options: undefined };

    const optionKeys = new Set([
      "as",
      "length",
      "type",
      "temperature",
      "maxTokens",
      "signal",
    ]);
    const keys = Object.keys(input);
    if (keys.length > 0 && keys.every((k) => optionKeys.has(k))) {
      return { vars: undefined, options: input as BillyOptions };
    }

    return { vars: input as Variables, options: undefined };
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

  private resolveVariables(prompt: string, variables?: Variables): string {
    if (!variables || Object.keys(variables).length === 0) return prompt;
    let result = prompt;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const serialized =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      result = result.replaceAll(placeholder, serialized);
    }
    return result;
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
    variables?: Variables,
    options?: BillyOptions,
  ): Promise<unknown> {
    const returnType = options?.as || this._returnType;
    const length = options?.length || this._length;
    this._returnType = undefined;
    this._length = undefined;
    const schema = this._schema;
    const resolvedPrompt = this.resolveVariables(prompt, variables);
    const memoryPrompt = this.buildMemoryPrompt(resolvedPrompt);

    const fullPrompt = this.buildPrompt(type, memoryPrompt, returnType, length);

    const response: BillyResponse = await this.client.chat(
      fullPrompt,
      this._systemPrompt,
      options,
    );

    if (response.error) {
      this._error = response.error;
      this._results = undefined;
      this._raw = "";
      throw new Error(response.error);
    }

    this._error = undefined;
    this._raw = response.content;

    if (schema) {
      const result = await this.resolveWithSchema(
        response.content,
        schema,
        fullPrompt,
      );

      if (this._memoryMax > 0) {
        this.addToMemory("user", resolvedPrompt);
        this.addToMemory("assistant", response.content);
      }

      return result;
    }

    const parsed = parseResponse(response.content);
    this._results = returnType ? parseAs(returnType, response.content) : parsed;

    if (this._memoryMax > 0) {
      this.addToMemory("user", resolvedPrompt);
      this.addToMemory("assistant", response.content);
    }

    return this._results;
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

  schema(def: SchemaDef): Billy<T> {
    this._schema = def;
    return this;
  }

  async *stream(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): BillyStream {
    const { vars, options } = this.parseArgs(varsOrOptions);
    const returnType = options?.as || this._returnType;
    const length = options?.length || this._length;
    const type = options?.type || "create";
    this._returnType = undefined;
    this._length = undefined;
    const schema = this._schema;
    const resolvedPrompt = this.resolveVariables(prompt, vars);
    const memoryPrompt = this.buildMemoryPrompt(resolvedPrompt);

    const fullPrompt = this.buildPrompt(type, memoryPrompt, returnType, length);

    const providerStream = this.client.chatStream(
      fullPrompt,
      this._systemPrompt,
      options,
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
            // biome-ignore lint/correctness/noUnsafeFinally: intentional - propagate schema errors after stream completion
            throw err;
          }
        } else {
          const parsed = parseResponse(fullContent);
          this._results = returnType
            ? parseAs(returnType, fullContent)
            : parsed;
        }

        if (this._memoryMax > 0) {
          this.addToMemory("user", resolvedPrompt);
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
    this._memoryTtl = ttl || 0;
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
