# Use Cases

All examples are available as runnable scripts in the [`examples/`](https://github.com/plinio8899/billy-sdk/tree/main/examples) directory.

---

## 1. Extractor de Facturas (Structured Data)

Extrae datos de facturas con estructura validada.

```javascript
const datos = await IA
  .schema({
    numero_factura: "string",
    fecha: "string",
    empresa: "string",
    total: "number",
    items: ["string"],
  })
  .extract("Extrae los datos de esta factura: {{texto}}", { texto: facturaTxt });
```

📄 `examples/invoice-extractor.mjs`

---

## 2. Clasificador de Tickets de Soporte

Clasifica automáticamente tickets por categoría, urgencia y sentimiento.

```javascript
const clasificacion = await IA
  .schema({ categoria: "string", urgencia: "string", sentimiento: "string" })
  .validate("Clasifica este ticket:\n\n{{ticket}}", { ticket });
```

📄 `examples/ticket-classifier.mjs`

---

## 3. Lenguaje Natural a SQL

Convierte preguntas en lenguaje natural a consultas SQL.

```javascript
IA.system("Eres un experto en SQL. Esquema: usuarios(id, nombre, email, ...)");
const sql = await IA.create("Dame todos los usuarios registrados en 2024");
```

📄 `examples/nl-to-sql.mjs`

---

## 4. Chatbot Multi-turno

Chatbot con historial de conversación para contexto multi-turno.

```javascript
IA.system("Eres un asistente amigable.");
const respuesta = await IA.create(contexto); // incluye historial
```

📄 `examples/chatbot.mjs`

---

## 5. Análisis de Sentimientos

Analiza el sentimiento de textos con estructura detallada.

```javascript
const analisis = await IA
  .schema({ sentimiento: "string", puntuacion: "number", emociones: ["string"] })
  .analyze('Analiza: "{{texto}}"', { texto });
```

📄 `examples/sentiment-analysis.mjs`

---

## 6. Generador de Emails

Genera emails profesionales con diferentes tonos y propósitos.

```javascript
IA.system("Eres un redactor profesional. Tono: cordial.");
const email = await IA.create(
  "Redacta un email de {{tipo}} sobre: {{contexto}}",
  { tipo: "presentación", contexto: "nuevo cliente" }
);
```

📄 `examples/email-generator.mjs`

---

## 7. Resumidor de Emails

Extrae información clave de emails largos.

```javascript
const resumen = await IA
  .schema({ asunto: "string", acciones_requeridas: ["string"], urgencia: "string" })
  .short()
  .extract("Resume este email:\n\n{{email}}", { email });
```

📄 `examples/email-summarizer.mjs`

---

## 8. Resumidor de Documentos

Resume archivos de texto extrayendo puntos clave.

```javascript
const resumen = await IA
  .schema({ titulo: "string", puntos_clave: ["string"], resumen: "string" })
  .extract("Resume este documento:\n\n{{texto}}", { texto });
```

📄 `examples/pdf-summarizer.mjs`

---

## 9. Moderación de Contenido

Modera comentarios según políticas de comunidad.

```javascript
const moderacion = await IA
  .schema({ es_aceptable: "boolean", categoria: "string", accion: "string" })
  .validate('Modera: "{{comentario}}"', { comentario });
```

📄 `examples/content-moderator.mjs`

---

## 10. Generador de Datos de Prueba

Genera datasets ficticios con estructura controlada.

```javascript
const usuarios = await IA
  .schema({ usuarios: [{ id: "number", nombre: "string", email: "string" }] })
  .create("Genera 5 usuarios ficticios para tests");

const productos = await IA.asArray().create(
  "Genera 8 productos con id, nombre, precio, categoria"
);
```

📄 `examples/test-data-generator.mjs`

---

## 11. RAG Básico (sin Vector DB)

Responde preguntas usando contexto inyectado vía variables.

```javascript
const respuesta = await IA.create(
  "Usando SOLO esta documentación:\n---\n{{docs}}\n---\n\nPregunta: {{pregunta}}",
  { docs: documentacion, pregunta }
);
```

📄 `examples/rag-basic.mjs`
