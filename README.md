# billy-sdk

![npm version](https://img.shields.io/npm/v/billy-sdk)
![npm downloads](https://img.shields.io/npm/dw/billy-sdk)
![License](https://img.shields.io/npm/l/billy-sdk)
![Node](https://img.shields.io/node/v/billy-sdk)
[![CI](https://github.com/plinio8899/billy-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/plinio8899/billy-sdk/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-vitepress-blue)](https://plinio8899.github.io/billy-sdk/)

The easiest AI SDK for Node.js — generate, modify, validate, analyze, extract, and execute with natural language prompts.

---

## Documentation

Full documentation is available at:

### [→ plinio8899.github.io/billy-sdk](https://plinio8899.github.io/billy-sdk/)

Includes guides for installation, providers, methods, type conversion, CLI, and use cases.

---

## Quick Start

```bash
npm install billy-sdk
```

```javascript
import billy from "billy-sdk";

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
| **CLI** | `npx billy-sdk config set <key>` |
| **Streaming** | `IA.stream()` — consume responses in real time |
| **Memory** | `billy({ memory: 10 })` — automatic conversation history |
| **Retry & Timeout** | Built-in, configurable |

## One-Minute Setup

```bash
# 1. Install
npm install billy-sdk

# 2. Set API key (Groq is free → https://console.groq.com)
#    Option A: Environment variable (recommended)
export GROQ_API_KEY=gsk_your_key

#    Option B: CLI (saves to ~/.billy-sdk/config.json)
npx billy-sdk config set gsk_your_key

# 3. Use it
echo 'import billy from "billy-sdk"; const IA = billy(); console.log(await IA.create("hola"));' | node
```

## Examples

See the [`examples/`](examples/) directory for 11 runnable scripts: invoice extraction, ticket classification, NL-to-SQL, chatbot, sentiment analysis, email generator, summarizer, content moderation, test data generation, and basic RAG.

## Requirements

- Node.js >= 18
- Internet connection
- API key (Groq offers a free tier)

## License

MIT
