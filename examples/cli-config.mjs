// Este ejemplo muestra el uso del CLI para config
// Ejecutar en terminal:
//   npx billy-agent config set tu_api_key
//   npx billy-agent config show
//   npx billy-agent config remove

import { execSync } from 'child_process';

try {
  const output = execSync('npx billy-agent', { encoding: 'utf-8' });
  console.log(output);
} catch (err) {
  console.error('Asegúrate de tener instalado billy-agent');
}
