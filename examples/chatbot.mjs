import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

IA.system('Eres un asistente amigable y divertido. Respondes en español.');

const historial = [];

async function preguntar(mensaje) {
  const contexto = historial.length > 0
    ? `Historial de la conversación:\n${historial.slice(-4).map(h => `${h.rol}: ${h.texto}`).join('\n')}\n\nUsuario: ${mensaje}`
    : mensaje;

  const respuesta = await IA.create(contexto);
  console.log(`🤖 ${respuesta}`);

  historial.push({ rol: 'Usuario', texto: mensaje });
  historial.push({ rol: 'Asistente', texto: respuesta });
}

console.log('🤖 Chatbot billy-sdk (escribe "salir" para terminar)\n');

const preguntasIniciales = [
  'Hola, ¿cómo estás?',
  '¿Puedes contarme un chiste?',
  'Ahora dime, ¿qué lenguajes de programación recomiendas para empezar?',
];

for (const pregunta of preguntasIniciales) {
  console.log(`👤 ${pregunta}`);
  await preguntar(pregunta);
  console.log('');
}
