# Getting Started

## Installation

```bash
npm install billy-agent
```

Requires Node.js 18 or higher.

## API Key

billy-agent uses Groq's free API. Get your key at [console.groq.com](https://console.groq.com/).

### Option 1: Environment Variable (Recommended)

```bash
export GROQ_API_KEY=gsk_your_api_key_here
```

For local development, create a `.env` file in your project root:

```bash
GROQ_API_KEY=gsk_your_api_key_here
```

> The `.env` file is **automatically detected** — no extra packages needed.

### Option 2: CLI (Quick Setup)

```bash
npx billy-agent config set gsk_your_api_key_here
```

Saves to `~/.billy-agent/config.json`. Use `npx billy-agent config show` to verify.

### Option 3: In Code

```javascript
import billy from "billy-agent";

const IA = billy({ apiKey: "gsk_your_api_key_here" });
```

**Priority order:** code > env var > .env file > config file

## Quick Start

```javascript
import billy from "billy-agent";

const IA = billy();

// Generate content
await IA.create("genera 10 preguntas sobre la biblia");
console.log(IA.results);

// Analyze data
await IA.analyze("dame estadísticas", { datos: [1, 2, 3, 4, 5] });
console.log(IA.results);

// Extract information
const info = await IA.asObject().extract(
  "Extrae nombre, email y teléfono: {{texto}}",
  { texto: "Contacto: Juan Pérez, juan@mail.com, +52 555 123 4567" }
);
console.log(info); // { nombre: "Juan Pérez", email: "juan@mail.com", telefono: "+52 555 123 4567" }
```

## Next Steps

- [Configuration options](/configuration)
- [Multi-provider setup](/providers)
- [Full method reference](/methods)
