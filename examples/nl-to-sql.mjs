import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

IA.system(`Eres un experto en SQL. Conviertes lenguaje natural a consultas SQL.
Usas solo SQL estándar compatible con PostgreSQL.
Respondes ÚNICAMENTE con el SQL, sin explicaciones.

Esquema de la base de datos:
- usuarios(id, nombre, email, fecha_registro, activo)
- productos(id, nombre, precio, stock, categoria)
- pedidos(id, usuario_id, producto_id, cantidad, total, fecha)
`);

const consultas = [
  'Dame todos los usuarios registrados en 2024',
  'Cuántos productos tienen stock menor a 10',
  'Top 5 productos más vendidos este mes',
  'Usuarios que han gastado más de $500 en total',
];

for (const consulta of consultas) {
  const sql = await IA.create(consulta);
  console.log(`Pregunta: ${consulta}`);
  console.log(`SQL: ${sql}`);
  console.log('');
}
