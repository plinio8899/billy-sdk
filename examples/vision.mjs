import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

// Usar Groq con modelo vision
const IAvision = billy({
  apiKey: process.env.GROQ_API_KEY,
  model: 'meta-llama/llama-4-scout-17b-16e-instruct',
});

// Ejemplo 1: imagen local via chaining
const descripcion = await IAvision
  .withImage('./foto.jpg')
  .create('Describe esta imagen en una frase');
console.log('Descripción:', descripcion);

// Ejemplo 2: imagen remota via options.files
const analisis = await IAvision.create(
  'Qué hay en esta imagen?',
  {
    files: [
      {
        type: 'image-url',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/300px-PNG_transparency_demonstration_1.png',
      },
    ],
  },
);
console.log('Análisis:', analisis);
