import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const numero = await IA.asNumber().execute('Cuánto es 15 * 7');
console.log('Número:', numero, typeof numero);

const colores = await IA.asArray().create('Dame 3 colores');
console.log('Array:', colores, Array.isArray(colores));

const persona = await IA.asObject().create('Dame un objeto con nombre y edad');
console.log('Objeto:', persona, typeof persona);
