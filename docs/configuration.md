# Configuration

Pass a config object to the `billy()` factory function:

```javascript
import billy from "billy-agent";

const IA = billy({
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 1000,
  timeout: 30000,
  retries: 3,
  apiKey: "gsk_your_key_here",
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `provider` | `string` | `"groq"` | AI provider: `groq`, `openai`, `anthropic` |
| `model` | `string` | Provider default | Model to use (see per-provider models) |
| `temperature` | `number` | `0.7` | Response randomness (0-1) |
| `maxTokens` | `number` | `1000` | Maximum tokens per response |
| `timeout` | `number` | `30000` | Request timeout in ms |
| `retries` | `number` | `3` | Number of retry attempts on failure |
| `apiKey` | `string` | — | API key (overrides env var and config file) |
| `systemPrompt` | `string` | — | System prompt to define AI's role or behavior |

## Provider Defaults

| Provider | Default Model | API Key Env Var |
|----------|---------------|-----------------|
| `groq` | `llama-3.3-70b-versatile` | `GROQ_API_KEY` |
| `openai` | `gpt-4o-mini` | `OPENAI_API_KEY` |
| `anthropic` | `claude-3-haiku-20240307` | `ANTHROPIC_API_KEY` |

## Examples

```javascript
// Minimal
const IA = billy();

// With all options
const IA = billy({
  model: "mixtral-8x7b-32768",
  temperature: 0.3,
  maxTokens: 2000,
});

// OpenAI
const IA = billy({
  provider: "openai",
  model: "gpt-4o",
  temperature: 0.5,
});
```
