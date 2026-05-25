import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const textos = [
  'Este producto es increíble, superó todas mis expectativas',
  'Pésimo servicio al cliente, nunca respondieron mi reclamo',
  'Está bien, cumple su función pero nada del otro mundo',
  'ESTO ES UNA ESTAFA, NO COMPREN AQUÍ',
  'Buena calidad-precio, lo recomendaría a mis amigos',
];

for (const texto of textos) {
  const analisis = await IA
    .schema({
      sentimiento: "string",
      puntuacion: "number",
      positivo: "boolean",
      emociones: ["string"],
      resumen: "string",
    })
    .analyze(`Analiza el sentimiento de este texto:\n\n"${texto}"`);

  console.log(`Texto: "${texto}"`);
  console.log(`  Sentimiento: ${analisis.sentimiento} | Puntuación: ${analisis.puntuacion}/10 | Positivo: ${analisis.positivo}`);
  console.log(`  Emociones: ${analisis.emociones?.join(', ')}`);
  console.log(`  Resumen: ${analisis.resumen}`);
  console.log('');
}
