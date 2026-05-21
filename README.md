# billy-agent

![npm version](https://img.shields.io/npm/v/billy-agent)
![npm downloads](https://img.shields.io/npm/dw/billy-agent)
![License](https://img.shields.io/npm/l/billy-agent)
![Node](https://img.shields.io/node/v/billy-agent)
[![CI](https://github.com/plinio8899/billy-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/plinio8899/billy-agent/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-vitepress-blue)](https://plinio8899.github.io/billy-agent/)

Simple AI for your projects - generate, modify, validate, analyze, extract, and execute with natural language prompts.

## Installation

```bash
npm install billy-agent
```

## Quick Start

```javascript
import billy from 'billy-agent';

const IA = billy();

// Generate content
await IA.create("genera 10 preguntas sobre la biblia");
console.log(IA.results);
```

## API

### Methods

| Method | Description |
|--------|-------------|
| `.create(prompt, variables)` | Generate new content |
| `.modify(prompt, variables)` | Transform existing results |
| `.validate(prompt, variables)` | Verify or answer questions |
| `.analyze(prompt, variables)` | Analyze data |
| `.extract(prompt, variables)` | Extract information from text |
| `.execute(prompt, variables)` | Execute calculation and return result |

### Properties

| Property | Description |
|----------|-------------|
| `.results` | Last result (string, object, array) |
| `.raw` | Raw response from AI |
| `.error` | Error message if failed |

### Variables in Prompts

```javascript
await IA.create("genera 5 preguntas sobre {{tema}}", { tema: "historia" });
await IA.analyze("dame estadísticas", { datos: [1, 2, 3, 4, 5] });
```

## Type Conversion

### Option 1: In second argument
```javascript
await IA.create("cuanto es 10 + 20", { as: 'number' });
await IA.create("dame 3 colores", { as: 'array' });
await IA.create("dame un objeto", { as: 'object' });
```

### Option 2: Set type first, then execute
```javascript
IA.asNumber();
await IA.create("cuanto es 5 * 10");

IA.asObject();
await IA.create("dame un objeto con nombre y edad");
```

### Available Types
| Type | Description |
|------|-------------|
| `string` | Returns as string (default) |
| `number` | Parses to number |
| `boolean` | Parses to boolean |
| `array` | Parses to array |
| `object` | Parses to object |
| `json` | Parses any valid JSON |

## Providers

billy-agent supports multiple AI providers. Groq is the default (no extra dependencies).

```javascript
// Groq (default, no extra install)
const IA = billy({ provider: 'groq', apiKey: 'gsk_...' });

// OpenAI (requires: npm install openai)
const IA = billy({ provider: 'openai', apiKey: 'sk-...' });

// Anthropic (requires: npm install @anthropic-ai/sdk)
const IA = billy({ provider: 'anthropic', apiKey: 'sk-ant-...' });
```

Each provider reads its own environment variable as fallback:
- `GROQ_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

## Configuration (Optional)

```javascript
const IA = billy({
  provider: 'groq',
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,
  maxTokens: 1000,
  timeout: 30000,
  retries: 3
});
```

### Available Models

| Provider | Model | Best For |
|----------|-------|----------|
| Groq | `llama-3.3-70b-versatile` | General purpose (default) |
| Groq | `llama-3.1-8b-instant` | Fast & cheap tasks |
| Groq | `mixtral-8x7b-32768` | Multilingual |
| OpenAI | `gpt-4o-mini` | General purpose (default) |
| OpenAI | `gpt-4o` | Complex tasks |
| OpenAI | `gpt-4-turbo` | High quality |
| Anthropic | `claude-3-haiku-20240307` | Fast (default) |
| Anthropic | `claude-3-sonnet-20240229` | Balanced |
| Anthropic | `claude-3-opus-20240229` | Complex |

## API Key

billy-agent uses Groq's free API. Get your free key at https://console.groq.com/

### Option 1: CLI (Recommended)
```bash
npx billy-agent config set your_api_key_here
```

### Option 2: Environment Variable
```bash
export GROQ_API_KEY=your_api_key_here
```

### Option 3: In Code
```javascript
const IA = billy({ apiKey: 'your_api_key_here' });
```

### Option 4: Config File
Create `billy-agent.config.json` in your project:
```json
{
  "apiKey": "your_api_key_here"
}
```

**Priority order:** code → env var → config file

## Requirements

- Node.js >= 18
- Internet connection
- Groq API key (free)

## License

MIT