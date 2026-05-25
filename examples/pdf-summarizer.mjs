import billy from 'billy-sdk';
import { readFileSync, existsSync } from 'node:fs';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const rutaArchivo = process.argv[2] || 'documento.txt';

if (!existsSync(rutaArchivo)) {
  const textoEjemplo = `INTRODUCCIÓN A LA INTELIGENCIA ARTIFICIAL

La inteligencia artificial (IA) es una rama de la informática que busca crear sistemas capaces de realizar tareas que requieren inteligencia humana.

HISTORIA
El campo de la IA nació en la conferencia de Dartmouth en 1956. Desde entonces, ha pasado por varios periodos de optimismo (llamados "veranos de la IA") y decepción ("inviernos de la IA").

APLICACIONES ACTUALES
Hoy en día, la IA se usa en:
- Procesamiento de lenguaje natural
- Visión por computadora
- Sistemas de recomendación
- Vehículos autónomos
- Diagnóstico médico

El futuro de la IA promete avances aún más transformadores en todas las industrias.`;

  console.log('ℹ️  Usando texto de ejemplo. Pasa un archivo como argumento: node pdf-summarizer.mjs mi-documento.txt');
  console.log('');
  var textoDocumento = textoEjemplo;
} else {
  var textoDocumento = readFileSync(rutaArchivo, 'utf-8');
}

const resumen = await IA
  .schema({
    titulo: "string",
    puntos_clave: ["string"],
    resumen: "string",
    nivel_tecnico: "string",
  })
  .extract(`Resume este documento extrayendo la información más importante:\n\n${textoDocumento.slice(0, 4000)}`);

console.log('📄 Resumen del documento:');
console.log(JSON.stringify(resumen, null, 2));
