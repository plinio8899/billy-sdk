import billy from 'billy-agent';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const resultado = await IA.create('Explica qué es JavaScript en 2 oraciones');
console.log('Resultado:', resultado);
console.log('Raw:', IA.raw);
