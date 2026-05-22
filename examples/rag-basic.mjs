import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const documentacion = `
billy-sdk es un SDK de IA para Node.js.
Soporta múltiples providers: Groq (default), OpenAI, y Anthropic.
Métodos principales: create, modify, validate, analyze, extract, execute.
Tipos de respuesta: string, number, boolean, array, object, json.
Chaining: .asNumber().short().create("prompt").
Config: billy({ provider: "openai", model: "gpt-4o", temperature: 0.7 }).
CLI: npx billy-sdk config set <api-key>.
Variable injection: {{placeholder}} en prompts.
Schemas validados con .schema().
`;

const preguntas = [
  '¿Qué providers soporta billy-sdk?',
  'Cómo se configura el modelo y temperatura?',
  'Qué métodos de tarea están disponibles?',
];

for (const pregunta of preguntas) {
  const respuesta = await IA.create(
    `Usando SOLO la siguiente documentación, responde:\n\n---\n{{docs}}\n---\n\nPregunta: {{pregunta}}\n\nSi la documentación no contiene la respuesta, di "No tengo esa información en mi contexto."`,
    { docs: documentacion, pregunta }
  );

  console.log(`Q: ${pregunta}`);
  console.log(`A: ${respuesta}`);
  console.log('');
}
