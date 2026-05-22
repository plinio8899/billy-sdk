// Este ejemplo muestra el uso del CLI para config
// Ejecutar en terminal:
//   npx billy-sdk config set tu_api_key
//   npx billy-sdk config show
//   npx billy-sdk config remove

import { execSync } from 'child_process';

try {
  const output = execSync('npx billy-sdk', { encoding: 'utf-8' });
  console.log(output);
} catch (err) {
  console.error('Asegúrate de tener instalado billy-sdk');
}
