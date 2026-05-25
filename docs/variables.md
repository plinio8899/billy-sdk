# Variables

Inject dynamic data into prompts using **JavaScript template literals**.

## Basic Usage

```javascript
const tema = "historia";
await IA.create(`Genera 5 preguntas sobre ${tema}`);
```

## Multiple Variables

```javascript
const tipo = "poema";
const tema = "el mar";
const nivel = "principiante";

await IA.create(
  `Escribe un ${tipo} sobre ${tema} para nivel ${nivel}`,
);
```

## Complex Values

Objects and arrays are serialized inline:

```javascript
const data = {
  usuarios: 1500,
  ingresos: 45000,
  periodo: "Q1 2026",
};

await IA.analyze(
  `Analiza estos datos: ${JSON.stringify(data, null, 2)}`,
);
```

## With Chaining

```javascript
const x = 7;
const y = 8;
const result = await IA.asNumber().short().execute(`${x} * ${y}`);
```

> Instead of `{{placeholder}}` syntax (removed), use standard JavaScript template literals directly in the prompt string.
