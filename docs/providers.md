# Providers

billy-agent supports multiple AI providers. Groq is the default with zero extra dependencies.

## Groq (Default)

No additional packages required.

```javascript
const IA = billy({ provider: "groq", apiKey: "gsk_..." });
```

### Available Models

| Model | Best For |
|-------|----------|
| `llama-3.3-70b-versatile` | General purpose (default) |
| `llama-3.1-8b-instant` | Fast & cheap tasks |
| `mixtral-8x7b-32768` | Multilingual |

Get a free API key at [console.groq.com](https://console.groq.com/).

## OpenAI

Requires: `npm install openai`

```javascript
const IA = billy({ provider: "openai", apiKey: "sk-..." });
```

### Available Models

| Model | Best For |
|-------|----------|
| `gpt-4o-mini` | General purpose (default) |
| `gpt-4o` | Complex tasks |
| `gpt-4-turbo` | High quality |

## Anthropic

Requires: `npm install @anthropic-ai/sdk`

```javascript
const IA = billy({ provider: "anthropic", apiKey: "sk-ant-..." });
```

### Available Models

| Model | Best For |
|-------|----------|
| `claude-3-haiku-20240307` | Fast (default) |
| `claude-3-sonnet-20240229` | Balanced |
| `claude-3-opus-20240229` | Complex |

## API Key Priority

When multiple sources provide an API key, the priority is:

1. Passed in code: `billy({ apiKey: "..." })`
2. Environment variable: `GROQ_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
3. `.env` file in project root (automatically detected)
4. Config file: `~/.billy-agent/config.json` (set via `npx billy-agent config set`)
