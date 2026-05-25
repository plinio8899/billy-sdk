import type { ReturnType } from "./types.js";

function cleanContent(content: string): string {
  let cleaned = content;

  const commonPrefixes = [
    /^Aquí tienes:\s*/i,
    /^Aquí te\s*/i,
    /^El resultado es:\s*/i,
    /^Resultado:\s*/i,
    /^Respuesta:\s*/i,
    /^Answer:\s*/i,
    /^Here is:\s*/i,
    /^Sure,\s*/i,
    /^Claro,\s*/i,
    /^Por supuesto,\s*/i,
    /^-{3,}\s*/,
    /^```\w*\s*/,
    /^```\s*/,
    /^\d+\.\s+/,
  ];

  for (const prefix of commonPrefixes) {
    cleaned = cleaned.replace(prefix, "");
  }

  cleaned = cleaned.replace(/```/g, "");

  return cleaned.trim();
}

export function parseResponse(content: string): unknown {
  const trimmed = cleanContent(content).trim();

  if (isJsonObject(trimmed)) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return content;
    }
  }

  if (isJsonArray(trimmed)) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return content;
    }
  }

  if (isNumeric(trimmed)) {
    const num = Number(trimmed);
    if (!Number.isNaN(num)) return num;
  }

  if (trimmed.toLowerCase() === "true") return true;
  if (trimmed.toLowerCase() === "false") return false;

  return content;
}

export function parseAs(type: ReturnType, content: string): unknown {
  const trimmed = cleanContent(content).trim();

  switch (type) {
    case "number": {
      const numMatch = trimmed.match(/-?\d+(\.\d+)?/);
      if (numMatch) {
        return parseFloat(numMatch[0]);
      }
      const num = Number(trimmed.replace(/[^0-9.-]/g, ""));
      return Number.isNaN(num) ? 0 : num;
    }

    case "boolean": {
      const lower = trimmed.toLowerCase();
      return (
        lower === "true" ||
        lower === "yes" ||
        lower === "1" ||
        lower === "si" ||
        lower === "sí"
      );
    }

    case "array": {
      try {
        const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const arr = JSON.parse(jsonMatch[0]);
          if (Array.isArray(arr)) return arr;
        }
      } catch {}
      const lines = trimmed
        .split(/[\n,]/)
        .map((s) => s.replace(/^[-•*]\s*/, "").trim())
        .filter((s) => s && !s.startsWith("```"));
      return lines;
    }

    case "object":
      try {
        const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(trimmed);
      } catch {
        return content;
      }

    case "json":
      try {
        const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(trimmed);
      } catch {
        return content;
      }
    default:
      return content;
  }
}

function isJsonObject(str: string): boolean {
  return str.startsWith("{") && str.endsWith("}");
}

function isJsonArray(str: string): boolean {
  return str.startsWith("[") && str.endsWith("]");
}

function isNumeric(str: string): boolean {
  return !Number.isNaN(Number(str)) && /^-?\d+(\.\d+)?$/.test(str);
}
