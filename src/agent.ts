import { LlmClient } from "./client.js";
import { parseAs, parseResponse } from "./parser.js";
import { schemaToPrompt, validateSchema } from "./schema.js";
import type {
  BillyConfig,
  BillyOptions,
  BillyResponse,
  ResponseLength,
  ReturnType,
  SchemaDef,
  TaskFunction,
  Variables,
} from "./types.js";

type BillyStream = AsyncIterable<string>;

export class Billy {
  private client: LlmClient;
  private _results: unknown = undefined;
  private _raw: string = "";
  private _error: string | undefined = undefined;
  private _returnType: ReturnType | undefined = undefined;
  private _length: ResponseLength | undefined = undefined;
  private _systemPrompt: string | undefined = undefined;
  private _schema: SchemaDef | undefined = undefined;

  constructor(config: BillyConfig = {}) {
    this.client = new LlmClient(config);
  }

  async create(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<unknown> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("create", prompt, vars, options);
  }

  async modify(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<unknown> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("modify", prompt, vars, options);
  }

  async validate(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<unknown> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("validate", prompt, vars, options);
  }

  async analyze(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<unknown> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("analyze", prompt, vars, options);
  }

  async extract(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<unknown> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("extract", prompt, vars, options);
  }

  async execute(
    prompt: string,
    varsOrOptions?: Variables | BillyOptions,
  ): Promise<unknown> {
    const { vars, options } = this.parseArgs(varsOrOptions);
    return this.run("execute", prompt, vars, options);
  }

  private parseArgs(input?: Variables | BillyOptions): {
    vars: Variables | undefined;
    options: BillyOptions | undefined;
  } {
    if (!input) return { vars: undefined, options: undefined };

    if (input && "as" in input) {
      return { vars: undefined, options: input as BillyOptions };
    }

    return { vars: input as Variables, options: undefined };
  }

  private async run(
    type: TaskFunction,
    prompt: string,
    variables?: Variables,
    options?: BillyOptions,
  ): Promise<unknown> {
    const returnType = options?.as || this._returnType;
    const length = options?.length || this._length;
    const schema = this._schema;

    const fullPrompt = this.buildPrompt(
      type,
      prompt,
      variables,
      returnType,
      length,
    );

    const response: BillyResponse = await this.client.chat(
      fullPrompt,
      this._systemPrompt,
    );

    if (response.error) {
      this._error = response.error;
      this._results = undefined;
      this._raw = "";
      throw new Error(response.error);
    }

    this._error = undefined;
    this._raw = response.raw;

    if (schema) {
      return this.resolveWithSchema(response.content, schema, fullPrompt);
    }

    const parsed = parseResponse(response.content);
    this._results = returnType ? parseAs(returnType, response.content) : parsed;

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
      const result = typeof parsed === "string" ? { error: parsed } : parsed;
      this._results = result;
      return result;
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

    this._raw = response.raw;
    return this.resolveWithSchema(response.content, schema, originalPrompt, attempt + 1);
  }

  private buildPrompt(
    type: TaskFunction,
    prompt: string,
    variables?: Variables,
    returnType?: ReturnType,
    length?: ResponseLength,
  ): string {
    let processedPrompt = prompt;

    if (variables && Object.keys(variables).length > 0) {
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        const serialized =
          typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value);
        processedPrompt = processedPrompt.replaceAll(placeholder, serialized);
      }
    }

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

    return `${taskInstructions[type]}\n\n${processedPrompt}${schemaInstruction}${typeInstruction}${lengthInstruction}`;
  }

  asString(): Billy {
    this._returnType = "string";
    return this;
  }

  asNumber(): Billy {
    this._returnType = "number";
    return this;
  }

  asBoolean(): Billy {
    this._returnType = "boolean";
    return this;
  }

  asArray(): Billy {
    this._returnType = "array";
    return this;
  }

  asObject(): Billy {
    this._returnType = "object";
    return this;
  }

  asJson(): Billy {
    this._returnType = "json";
    return this;
  }

  short(): Billy {
    this._length = "short";
    return this;
  }

  medium(): Billy {
    this._length = "medium";
    return this;
  }

  long(): Billy {
    this._length = "long";
    return this;
  }

  system(prompt: string): Billy {
    this._systemPrompt = prompt;
    return this;
  }

  schema(def: SchemaDef): Billy {
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
    const schema = this._schema;

    const fullPrompt = this.buildPrompt(
      "create",
      prompt,
      vars,
      returnType,
      length,
    );

    const providerStream = this.client.chatStream(
      fullPrompt,
      this._systemPrompt,
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
            throw err;
          }
        } else {
          const parsed = parseResponse(fullContent);
          this._results = returnType
            ? parseAs(returnType, fullContent)
            : parsed;
        }
      }
    }
  }

  // biome-ignore lint/suspicious/noThenProperty: intentional thenable pattern
  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: unknown) => TResult1 | PromiseLike<TResult1>)
      | undefined,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined,
  ): Promise<TResult1 | TResult2> {
    if (this._error) {
      return Promise.reject(new Error(this._error));
    }
    if (this._results !== undefined) {
      return Promise.resolve(this._results).then(onfulfilled, onrejected);
    }
    return Promise.reject(new Error("No result yet"));
  }

  get results(): unknown {
    return this._results;
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
