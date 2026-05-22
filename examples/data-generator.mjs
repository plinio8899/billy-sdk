// Renamed from test-data-generator.mjs to avoid node --test detection
import billy from 'billy-sdk';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

console.log('🧪 Generador de datos de prueba\n');

const usuarios = await IA
  .schema({
    usuarios: [{
      id: "number",
      nombre: "string",
      email: "string",
      rol: "string",
      activo: "boolean",
    }],
  })
  .create(`Genera un array con 5 usuarios ficticios para tests.
Cada usuario debe tener: id (número), nombre, email, rol (admin, user, editor), activo.
Responde ÚNICAMENTE con un objeto JSON con una propiedad "usuarios" que sea un array.`);

console.log('Usuarios:', JSON.stringify(usuarios, null, 2));

const productos = await IA
  .asArray()
  .create(`Genera un array JSON con 8 productos ficticios para tests.
Cada producto debe tener: id (number), nombre, precio (number), categoria, stock (number), en_oferta (boolean).
Responde ÚNICAMENTE con el array JSON.`);

console.log('\nProductos:', JSON.stringify(productos, null, 2));
