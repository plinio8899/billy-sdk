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

## Properties

After any method call, these properties are available:

| Property | Type | Description |
|----------|------|-------------|
| `.results` | `unknown` | Last result (parsed) |
| `.raw` | `string` | Raw response from AI |
| `.error` | `string \| undefined` | Error message if failed |
