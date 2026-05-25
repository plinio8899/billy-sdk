# Method Chaining

billy-sdk supports a fluent API style for configuring calls.

## Basic Chain

```javascript
const result = await IA.asNumber().short().execute("15 * 7");
```

Each method returns the same instance, so you can chain indefinitely.

## Available Chain Methods

### Type Setters

| Method | Sets |
|--------|------|
| `.asString()` | Return type to string |
| `.asNumber()` | Return type to number |
| `.asBoolean()` | Return type to boolean |
| `.asArray()` | Return type to array |
| `.asObject()` | Return type to object |
| `.asJson()` | Return type to JSON |

### Schema Validation

| Method | Sets |
|--------|------|
| `.schema(def)` | Expected response structure (validates + retries) |

### System Prompt

| Method | Sets |
|--------|------|
| `.system(prompt)` | System prompt (role/behavior) |

### Length Setters

| Method | Sets |
|--------|------|
| `.short()` | Very brief response |
| `.medium()` | Concise response |
| `.long()` | Detailed response |

### Memory

| Method | Description |
|--------|-------------|
| `.withMemory(n, ttl?)` | Enable conversation history (chainable) |

```javascript
const IA = billy();
IA.withMemory(5);

await IA.create("Hola, me llamo Juan");
await IA.create("¿Cómo me llamo?"); // sabe tu nombre
```

### Terminal Operations

Chain methods are consumed by calling one of these:

| Method | Returns |
|--------|---------|
| `.create()` | `Promise<unknown>` — full response |
| `.stream()` | `AsyncIterable<string>` — chunk by chunk |

`.stream()` also accepts `{ type, temperature, maxTokens, signal }` as second argument:

```javascript
const stream = IA.stream("Extrae los datos", { type: "extract", temperature: 0.5 });
```

## Full Chain Example

```javascript
const result = await IA.asObject()
  .long()
  .create("Dame un perfil detallado de un desarrollador fullstack");

// Streaming variant
const stream = IA.asObject()
  .long()
  .stream("Dame un perfil detallado");
for await (const chunk of stream) { process.stdout.write(chunk); }
```

## Reusing Configuration

Chain methods persist the configuration for subsequent calls:

```javascript
IA.asNumber().short();

const a = await IA.execute("5 * 3");    // returns number
const b = await IA.execute("100 / 4");  // also returns number
```

To reset, create a new instance or call with explicit options:

```javascript
const IA = billy(); // fresh instance
```
