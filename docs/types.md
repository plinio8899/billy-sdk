# Type Conversion

Control how the response is parsed before returning.

## Option 1: In the second argument

```javascript
await IA.create("cuanto es 10 + 20", { as: "number" });
await IA.create("dame 3 colores", { as: "array" });
await IA.create("dame un objeto", { as: "object" });
await IA.create("¿esto es cierto?", { as: "boolean" });
await IA.create("dame JSON", { as: "json" });
```

## Option 2: Chaining methods

```javascript
IA.asNumber();
await IA.create("cuanto es 5 * 10"); // returns number

IA.asObject();
await IA.create("dame un objeto con nombre y edad"); // returns object
```

## Available Types

| Type | Description | Example Output |
|------|-------------|----------------|
| `string` | Returns as string (default) | `"texto plano"` |
| `number` | Parses to number | `42` |
| `boolean` | Parses to boolean | `true` |
| `array` | Parses to array | `["a", "b", "c"]` |
| `object` | Parses to object | `{ name: "Juan" }` |
| `json` | Parses any valid JSON | Object or array |

## Schema Validation

Define exact structures with `.schema()` — the response is validated and automatically retried on failure.

```javascript
const user = await IA
  .schema({
    name: "string",
    age: "number",
    tags: ["string"],
  })
  .create("Dame un usuario");

console.log(user);
// → { name: "Ana", age: 28, tags: ["admin", "user"] }
```

See [Methods → .schema()](/methods#schema-def) for full reference.

## Automatic Detection

Without specifying a type, the parser automatically detects:

- JSON objects `{...}` → object
- JSON arrays `[...]` → array
- Numeric values → number
- `true` / `false` → boolean
- Everything else → string

```javascript
const result = await IA.create(
  'Responde con JSON: { "nombre": "Ana", "edad": 30 }'
);
console.log(result); // { nombre: "Ana", edad: 30 } (object)

const num = await IA.execute("5 + 3");
console.log(num); // 8 (number)
```

## Response Length

Control response verbosity:

```javascript
IA.short();   // Very brief — one word or short phrase
IA.medium();  // Concise (default)
IA.long();    // Detailed and complete

// Combined with type
const res = await IA.asArray().short().create("dame 3 números");
```
