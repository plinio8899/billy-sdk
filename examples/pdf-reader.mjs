import billy from 'billy-sdk';
import { readFileSync, existsSync } from 'node:fs';

const IA = billy({ apiKey: process.env.ANTHROPIC_API_KEY });

const rutaPdf = process.argv[2] || 'documento.pdf';

if (!existsSync(rutaPdf)) {
  console.log('Pasa un archivo PDF como argumento: node pdf-reader.mjs documento.pdf');
  process.exit(1);
}

// Anthropic soporta PDFs nativamente (type: "document")
const resumen = await IA
  .withPdf(rutaPdf)
  .extract('Resume este documento en 3 puntos clave');

console.log('Resumen:', resumen);

// También se puede hacer con options.files
const analisis = await IA.extract(
  'Extrae los datos más importantes de este documento',
  { files: [{ type: 'pdf', path: rutaPdf }] },
);
console.log('Análisis:', analisis);
