import billy from 'billy-agent';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const preguntas = await IA.create(
  'Genera 3 preguntas sobre {{tema}} para nivel {{nivel}}',
  { tema: 'historia medieval', nivel: 'principiante' }
);
console.log('Preguntas:', preguntas);

const analisis = await IA.analyze(
  'Resume estos datos: {{datos}}',
  { datos: [10, 20, 30, 40, 50] }
);
console.log('Análisis:', analisis);
