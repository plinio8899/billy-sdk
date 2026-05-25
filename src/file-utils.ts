import { readFile } from "node:fs/promises";
import { extname } from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export async function readAsBase64(path: string): Promise<string> {
  const buffer = await readFile(path);
  return buffer.toString("base64");
}

export function mimeType(path: string): string {
  return MIME_TYPES[extname(path).toLowerCase()] ?? "application/octet-stream";
}

export async function readAsText(path: string): Promise<string> {
  return await readFile(path, "utf-8");
}

export async function extractPdfText(path: string): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const buffer = await readFile(path);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}
