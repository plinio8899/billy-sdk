# billy-agent

![npm version](https://img.shields.io/npm/v/billy-agent)
![npm downloads](https://img.shields.io/npm/dw/billy-agent)
![License](https://img.shields.io/npm/l/billy-agent)
![Node](https://img.shields.io/node/v/billy-agent)
[![CI](https://github.com/plinio8899/billy-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/plinio8899/billy-agent/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-vitepress-blue)](https://plinio8899.github.io/billy-agent/)

Simple AI for your projects — generate, modify, validate, analyze, extract, and execute with natural language prompts.

---

## Documentation

Full documentation is available at:

### [→ plinio8899.github.io/billy-agent](https://plinio8899.github.io/billy-agent/)

Includes guides for installation, providers, methods, type conversion, CLI, and use cases.

---

## Quick Start

```bash
npm install billy-agent
```

```javascript
import billy from "billy-agent";

const IA = billy();

await IA.create("genera 10 preguntas sobre la biblia");
console.log(IA.results);
```

## Features

| | |
|---|---|
| **Multi-Provider** | Groq (default, free), OpenAI, Anthropic |
| **Type Conversion** | Automatic parsing to number, array, object, boolean, JSON |
| **Method Chaining** | `IA.asNumber().short().create("prompt")` |
| **Variable Injection** | `create("prompt {{var}}", { var: value })` |
| **CLI** | `npx billy-agent config set <key>` |
| **Retry & Timeout** | Built-in, configurable |

## One-Minute Setup

```bash
# 1. Install
npm install billy-agent

# 2. Set API key (Groq is free → https://console.groq.com)
npx billy-agent config set gsk_your_key

# 3. Use it
echo 'import billy from "billy-agent"; const IA = billy(); console.log(await IA.create("hola"));' | node
```

## Examples

See the [`examples/`](examples/) directory for runnable scripts.

## Requirements

- Node.js >= 18
- Internet connection
- API key (Groq offers a free tier)

## License

MIT
