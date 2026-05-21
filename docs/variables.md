# Variables

Inject dynamic data into prompts using `{{placeholder}}` syntax.

## Basic Usage

```javascript
await IA.create("Genera 5 preguntas sobre {{tema}}", { tema: "historia" });
```

## Multiple Variables

```javascript
await IA.create(
  "Escribe un {{tipo}} sobre {{tema}} para nivel {{nivel}}",
  { tipo: "poema", tema: "el mar", nivel: "principiante" }
);
```

## Complex Values

Objects and arrays are automatically serialized to JSON:

```javascript
const data = {
  usuarios: 1500,
  ingresos: 45000,
  periodo: "Q1 2026",
};

await IA.analyze("Analiza estos datos: {{datos}}", { datos: data });
```

## Combined with Options

You can pass both variables and type options in the second argument:

```javascript
await IA.create("Cuánto es {{a}} + {{b}}", {
  a: 10,
  b: 20,
  as: "number",
});
```

## With Chaining

```javascript
const result = await IA.asNumber()
  .short()
  .execute("Calcula {{x}} * {{y}}", { x: 7, y: 8 });
```
