# Methods

All methods return `Promise<unknown>` and store the result in `.results`.

## .create(prompt, variables?)

Generate new content.

```javascript
await IA.create("Escribe un poema sobre el mar");
await IA.create("Genera 5 preguntas sobre {{tema}}", { tema: "historia" });
```

## .modify(prompt, variables?)

Transform existing content.

```javascript
await IA.create("Una casa en el campo");
await IA.modify("Convierte eso en un texto más poético");
// Uses previous .results as context
```

## .validate(prompt, variables?)

Verify or answer questions.

```javascript
const isValid = await IA.asBoolean().validate(
  "¿Este email contiene phishing? {{email}}",
  { email: "win@prize.com" }
);
```

## .analyze(prompt, variables?)

Analyze data and provide insights.

```javascript
const analysis = await IA.analyze(
  "Dame un resumen de estas métricas: {{datos}}",
  { datos: { users: 1500, revenue: 45000, churn: 0.05 } }
);
```

## .extract(prompt, variables?)

Extract specific information from text.

```javascript
const info = await IA.asObject().extract(
  "Extrae: nombre, email, teléfono del texto: {{texto}}",
  { texto: "Juan Pérez, juan@mail.com, +52 555 123 4567" }
);
```

## .execute(prompt, variables?)

Execute a calculation and return the result.

```javascript
const result = await IA.asNumber().execute("Cuánto es 15 * 7");
console.log(result); // 105
```

## .schema(def)

Define a **structured schema** that the response must match. Chainable. Automatically validates and retries if the LLM response doesn't fit.

```javascript
const user = await IA
  .schema({
    name: "string",
    age: "number",
    active: "boolean",
  })
  .create("Dame un usuario ficticio");

console.log(user);
// → { name: "Ana", age: 28, active: true }
```

### Supported types in schemas

| Schema type | JS type | Example |
|-------------|---------|---------|
| `"string"` | `string` | `"Juan"` |
| `"number"` | `number` | `42` |
| `"boolean"` | `boolean` | `true` |
| `["string"]` | `string[]` | `["a", "b"]` |
| `["number"]` | `number[]` | `[1, 2]` |
| `{ ... }` | Nested object | `{ city: "string" }` |

### Nested schemas

```javascript
const result = await IA
  .schema({
    title: "string",
    tags: ["string"],
    author: {
      name: "string",
      age: "number",
    },
  })
  .create("Dame un post con autor");
```

### Automatic retry on validation failure

If the LLM returns something that doesn't match the schema, billy-agent automatically retries with the validation errors as feedback.

## .system(prompt)

Set a system prompt to define the AI's role, behavior, or constraints. Chainable.

```javascript
IA.system("Eres un experto en historia medieval");

const respuesta = await IA.create("Háblame sobre el feudalismo");
```

The system prompt can be combined with any method and type:

```javascript
const criticas = await IA
  .system("Eres un crítico de cine sarcástico")
  .asArray()
  .create("Dame 3 reseñas de películas de terror");
```

You can also set it in the initial configuration:

```javascript
const IA = billy({ systemPrompt: "Eres un asistente amigable" });
```

## Properties

After any method call, these properties are available:

| Property | Type | Description |
|----------|------|-------------|
| `.results` | `unknown` | Last result (parsed) |
| `.raw` | `string` | Raw response from AI |
| `.error` | `string \| undefined` | Error message if failed |
