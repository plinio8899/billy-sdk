import billy from 'billy-sdk';

const IA = billy({
  apiKey: process.env.GROQ_API_KEY,
  memory: 10,
  systemPrompt: 'Eres un asistente amigable y divertido. Respondes en español.',
});

console.log('🤖 Chatbot con memoria (escribe "salir" para terminar)\n');

const preguntasIniciales = [
  'Hola, ¿cómo estás?',
  '¿Puedes contarme un chiste?',
  'Ahora dime, ¿qué lenguajes de programación recomiendas para empezar?',
];

for (const pregunta of preguntasIniciales) {
  console.log(`👤 ${pregunta}`);
  const respuesta = await IA.create(pregunta);
  console.log(`🤖 ${respuesta}`);
  console.log('');
}

console.log('📝 Historial almacenado automáticamente:', IA.memory.length, 'mensajes');
