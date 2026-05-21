# Use Cases

## 1. Code Documentation Generation

```javascript
const IA = billy();

await IA.create(
  "Genera documentación JSDoc para esta función: {{code}}",
  { code: functionFuente }
);
```

## 2. Automated Code Review

```javascript
await IA.validate(
  "Revisa este código en busca de bugs y problemas de seguridad: {{diff}}",
  { diff: gitDiff }
);
```

## 3. Structured Data Extraction

```javascript
const data = await IA.asObject().extract(
  "Extrae nombre, email, teléfono y dirección: {{texto}}",
  { texto: rawEmail }
);
```

## 4. Test Data Generation

```javascript
const users = await IA.asArray().create(
  "Genera 5 objetos de usuario con nombre, email y rol para tests"
);
```

## 5. Automated Reporting

```javascript
await IA.analyze(
  "Resumen ejecutivo de métricas semanales: {{datos}}",
  { datos: csvMetrics }
);
```

## 6. Data Transformation

```javascript
const result = await IA.asArray().execute(
  "Convierte este CSV a array de objetos: {{csv}}",
  { csv: rawCsv }
);
```

## 7. Content Validation

```javascript
const isValid = await IA.asBoolean().validate(
  "¿Este texto cumple con tono profesional? {{texto}}",
  { texto: draftContent }
);
```

## 8. Batch Processing

```javascript
for (const item of items) {
  const result = await IA.extract(
    "Extrae keywords de: {{text}}",
    { text: item }
  );
  await saveToDb(item.id, result);
  await sleep(500); // respect rate limits
}
```
