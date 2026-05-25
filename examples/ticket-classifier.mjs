import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const tickets = [
  'No puedo iniciar sesión, me dice "contraseña incorrecta"',
  '¿Cuándo van a liberar la nueva versión con modo oscuro?',
  'Quiero cancelar mi suscripción, ya no la uso',
  'El botón de pago no responde en Chrome',
  'Excelente producto, me encantó la interfaz',
  'Me cobraron dos veces el mismo mes',
];

for (const ticket of tickets) {
  const clasificacion = await IA
    .schema({
      categoria: "string",
      urgencia: "string",
      sentimiento: "string",
      respuesta_sugerida: "string",
    })
    .validate(`Clasifica este ticket de soporte:\n\n${ticket}`);

  console.log(`Ticket: ${ticket.slice(0, 50)}...`);
  console.log(`  → ${clasificacion.categoria} | ${clasificacion.urgencia} | ${clasificacion.sentimiento}`);
  console.log(`  → Sugerencia: ${clasificacion.respuesta_sugerida}`);
  console.log('');
}
