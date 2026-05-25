import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const tema = 'historia medieval';
const nivel = 'principiante';
const preguntas = await IA.create(
  `Genera 3 preguntas sobre ${tema} para nivel ${nivel}`,
);
console.log('Preguntas:', preguntas);

const datos = JSON.stringify([10, 20, 30, 40, 50]);
const analisis = await IA.analyze(
  `Resume estos datos: ${datos}`,
);
console.log('Análisis:', analisis);
