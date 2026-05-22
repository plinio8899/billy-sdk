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

## Full Chain Example

```javascript
const result = await IA.asObject()
  .long()
  .create("Dame un perfil detallado de un desarrollador fullstack");
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
