import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const emailLargo = `Hola equipo,

Les escribo para informarles sobre los cambios en el proyecto Q4.

Primero, la fecha de entrega del módulo de pagos se extiende hasta el 15 de diciembre debido a problemas con el proveedor de la pasarela de pagos.

Segundo, el cliente aprobó el presupuesto adicional para la integración con Salesforce, así que podemos comenzar esa fase la próxima semana.

Tercero, necesito que cada líder de equipo me envíe un reporte de avances antes del viernes para la reunión con stakeholders.

Por último, la reunión semanal se cambia al miércoles 10am.

Saludos,
María
Project Manager`;

const resumen = await IA
  .schema({
    asunto: "string",
    acciones_requeridas: ["string"],
    fechas_importantes: ["string"],
    resumen_ejecutivo: "string",
    urgencia: "string",
  })
  .short()
  .extract('Resume este email extrayendo la información clave:\n\n{{email}}', {
    email: emailLargo,
  });

console.log('📬 Resumen de email:');
console.log(JSON.stringify(resumen, null, 2));
