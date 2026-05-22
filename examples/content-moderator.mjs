import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const comentarios = [
  'Excelente artículo, muy informativo',
  'Eres un idiota, no sabes nada de esto',
  'Te invito a comprar mi curso en bit.ly/estafa-123',
  'Estoy totalmente de acuerdo con el punto 3',
  'Odio este sitio y todos los que trabajan aquí',
  'Buena información, gracias por compartir',
];

for (const comentario of comentarios) {
  const moderacion = await IA
    .schema({
      es_aceptable: "boolean",
      categoria: "string",
      razon: "string",
      accion: "string",
    })
    .validate('Modera este comentario según las políticas de la comunidad:\n\n"{{comentario}}"', {
      comentario,
    });

  const icono = moderacion.es_aceptable ? '✅' : '❌';
  console.log(`${icono} "${comentario}"`);
  console.log(`   → ${moderacion.categoria} | ${moderacion.accion}`);
  if (!moderacion.es_aceptable) {
    console.log(`   → Razón: ${moderacion.razon}`);
  }
  console.log('');
}
