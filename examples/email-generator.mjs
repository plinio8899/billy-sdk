import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const emails = [
  {
    tipo: 'presentación',
    contexto: 'nuevo cliente potencial del rubro tecnología',
    tono: 'profesional pero cercano',
  },
  {
    tipo: 'seguimiento',
    contexto: 'entrevista técnica que hicieron a un candidato',
    tono: 'cordial',
  },
  {
    tipo: 'reclamo',
    contexto: 'cliente insatisfecho porque su pedido llegó tarde',
    tono: 'empático y resolutivo',
  },
  {
    tipo: 'newsletter',
    contexto: 'anuncio de nueva funcionalidad IA en la plataforma',
    tono: 'emocionante y claro',
  },
];

for (const { tipo, contexto, tono } of emails) {
  IA.system(`Eres un redactor profesional de emails. Redactas en español.
El tono debe ser: ${tono}.`);

  const email = await IA.create(
    'Redacta un email de {{tipo}} sobre: {{contexto}}.\n\nIncluye asunto y cuerpo.',
    { tipo, contexto }
  );

  console.log(`📧 ${tipo.toUpperCase()} (${tono})`);
  console.log(email);
  console.log('---\n');
}
