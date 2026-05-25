# File, Image & PDF Support

billy-sdk supports attaching images, PDFs, and text files to your prompts. Each provider handles files according to its native capabilities.

## File Types

| Type | Description | Supported by |
|------|-------------|--------------|
| `image` | Local image file (JPEG, PNG, GIF, WebP) | Groq, OpenAI, Anthropic |
| `image-url` | Remote image URL | Groq, OpenAI, Anthropic |
| `pdf` | PDF document | Anthropic (native), Groq/OpenAI (text extraction) |
| `text` | Raw text content | All providers |

## Attaching Files

### Via chaining (recommended)

```javascript
import billy from "billy-sdk";
const IA = billy({ apiKey: process.env.GROQ_API_KEY });

// Local image
await IA.withImage("./foto.jpg").create("Describe esta imagen");

// Remote image
await IA.withImageUrl("https://ejemplo.com/img.jpg", "high")
  .create("Qué ves?");

// PDF (Anthropic: native; Groq/OpenAI: text extraction)
await IA.withPdf("./documento.pdf").extract("Resume");

// Raw text
await IA.withText("contexto adicional").create("Usa esto");
```

### Via `BillyOptions.files`

```javascript
await IA.create("Describe", {
  files: [{ type: "image", path: "./foto.jpg" }]
});

await IA.extract("Resume", {
  files: [{ type: "pdf", path: "./doc.pdf" }]
});

await IA.create("Qué hay?", {
  files: [{
    type: "image-url",
    url: "https://ejemplo.com/img.jpg",
    detail: "high",
  }]
});
```

### Multiple files

```javascript
await IA.withImage("./diagrama.png")
  .withText("Contexto: reporte Q1")
  .create("Explica este diagrama");

// Or via options
await IA.create("Compara estas imágenes", {
  files: [
    { type: "image", path: "./antes.jpg" },
    { type: "image", path: "./despues.jpg" },
  ],
});
```

## Provider Compatibility

| Feature | Groq | OpenAI | Anthropic |
|---------|------|--------|-----------|
| Images (local) | ✅ base64 data URL | ✅ base64 data URL | ✅ raw base64 |
| Images (URL) | ✅ `image_url` | ✅ `image_url` | ✅ `source.url` |
| PDF (native) | ❌ text extraction | ❌ text extraction | ✅ `type: "document"` |
| Text files | ✅ as text part | ✅ as text part | ✅ as text block |
| Max images/req | ~5 | many | many |
| Detail control | ✅ `detail` param | ✅ `detail` param | ❌ not applicable |

> **PDF note:** Anthropic processes PDFs natively via `type: "document"` content blocks (preserves layout, tables, up to 32MB / ~100 pages).  
> Groq and OpenAI extract text from PDFs using `pdf-parse` before sending — layout information is not preserved.

## Examples

See `examples/vision.mjs` and `examples/pdf-reader.mjs` in the repository.
