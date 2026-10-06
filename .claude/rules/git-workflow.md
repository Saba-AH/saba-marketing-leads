# Convenciones de Git y Commits

## Estilo de commits (Conventional Commits)

Formato: `<tipo>(<ámbito>): <descripción corta en imperativo>` — en español, sin punto final. El `<ámbito>` es opcional pero recomendado (el módulo o feature tocado).

### Tipos permitidos

- `feat`: nueva funcionalidad
- `fix`: corrección de un error
- `refactor`: cambio de código que no corrige un bug ni añade una funcionalidad
- `style`: cambios de formato (espacios, comas, etc.) que no afectan el comportamiento
- `docs`: documentación
- `test`: añadir o corregir pruebas
- `chore`: mantenimiento, dependencias o configuración del build

### Ejemplos

- `feat(users): implementar validación zod en el formulario de registro`
- `fix(auth): corregir refresco de token expirado`
- `refactor(shared): extraer botón genérico a shared/components`
