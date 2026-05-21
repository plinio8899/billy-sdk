import type { SchemaDef } from "./types.js";

export function validateSchema(
  value: unknown,
  schema: SchemaDef,
  path = "$",
): string[] {
  const errors: string[] = [];

  if (typeof schema === "string") {
    if (schema === "string" && typeof value !== "string") {
      errors.push(`${path}: expected string, got ${typeof value}`);
    } else if (schema === "number" && typeof value !== "number") {
      errors.push(`${path}: expected number, got ${typeof value}`);
    } else if (schema === "boolean" && typeof value !== "boolean") {
      errors.push(`${path}: expected boolean, got ${typeof value}`);
    }
  } else if (Array.isArray(schema)) {
    if (!Array.isArray(value)) {
      errors.push(`${path}: expected array, got ${typeof value}`);
    } else {
      const elementSchema = schema[0];
      for (let i = 0; i < value.length; i++) {
        errors.push(
          ...validateSchema(value[i], elementSchema, `${path}[${i}]`),
        );
      }
    }
  } else if (typeof schema === "object" && schema !== null) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push(`${path}: expected object, got ${typeof value}`);
    } else {
      const record = value as Record<string, unknown>;
      for (const key of Object.keys(schema)) {
        if (!(key in record)) {
          errors.push(`${path}.${key}: missing required field`);
        } else {
          errors.push(
            ...validateSchema(record[key], schema[key], `${path}.${key}`),
          );
        }
      }
    }
  }

  return errors;
}

export function schemaToPrompt(schema: SchemaDef): string {
  if (typeof schema === "string") {
    return schema;
  }

  if (Array.isArray(schema)) {
    return `[${schemaToPrompt(schema[0])}]`;
  }

  const entries = Object.entries(schema);
  if (entries.length === 0) return "{}";
  const fields = entries
    .map(([key, value]) => `  "${key}": ${schemaToPrompt(value)}`)
    .join(",\n");
  return `{\n${fields}\n}`;
}
