import billy from 'billy-sdk';
import { readFileSync, existsSync } from 'node:fs';

const IA = billy({ apiKey: process.env.GROQ_API_KEY });

const rutaFactura = process.argv[2] || 'factura.txt';

const textoFactura = existsSync(rutaFactura)
  ? readFileSync(rutaFactura, 'utf-8')
  : `Factura #F-2024-001
Fecha: 15/03/2024
Empresa: TechSolutions S.A.
Nit: 901.123.456-7

Items:
1. Servicio de hosting anual - $250.00
2. Licencia premium - $800.00
3. Dominio .com - $15.00

Subtotal: $1,065.00
IVA (19%): $202.35
Total: $1,267.35`;

const datos = await IA
  .schema({
    numero_factura: "string",
    fecha: "string",
    empresa: "string",
    nit: "string",
    items: ["string"],
    subtotal: "number",
    iva: "number",
    total: "number",
  })
  .extract('Extrae los datos estructurados de esta factura:\n\n{{texto}}', {
    texto: textoFactura,
  });

console.log('Factura extraída:', JSON.stringify(datos, null, 2));
