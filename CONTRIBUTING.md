# Contribuyendo a billy-agent

Gracias por tu interés en contribuir. Estas son las guías para mantener el proyecto consistente.

## Reportar bugs

1. Verifica que el bug no esté ya reportado en [Issues](https://github.com/plinio8899/billy-agent/issues)
2. Crea un nuevo issue con:
   - Versión del package y Node.js
   - Código mínimo para reproducirlo
   - Comportamiento esperado vs real

## Sugerir mejoras

Abre un issue describiendo la mejora, el caso de uso y un ejemplo de cómo funcionaría.

## Pull Requests

1. Haz fork del repo y crea una rama desde `master`
2. Sigue el estilo de código existente (TypeScript, sin comentarios)
3. Asegura que `npm run build` y `npm test` pasen
4. Actualiza el README si es necesario
5. Crea el PR con descripción clara de los cambios

## Scripts disponibles

```bash
npm run build    # Compila TypeScript
npm test         # Ejecuta tests con node:test
```

## Convenciones

- TypeScript estricto, ESM (`import`/`export`)
- Sin comentarios en código (el código debe ser auto-documentado)
- Nombres en inglés para código, español para prompts por defecto
- Tests obligatorios para nueva funcionalidad
