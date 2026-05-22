import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

console.log('Streaming respuesta:\n');

const stream = IA.stream('Escribe un párrafo corto sobre la inteligencia artificial');

for await (const chunk of stream) {
  process.stdout.write(chunk);
}

console.log('\n\n--- Resultado completo ---');
console.log(IA.results);
