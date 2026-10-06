# Permisos

Patrón de referencia para autorización basada en permisos. El template no trae un módulo de acceso todavía; cuando el proyecto lo necesite, seguí estas reglas.

Los permisos efectivos son **rol ± overrides** y se resuelven **server-side en cada petición**. Nunca se decide un permiso en el frontend: la API le informa sus permisos efectivos solo para que pinte la interfaz, y no confía en lo que el cliente diga.

Nomenclatura: `<recurso>:<accion>` — p. ej. `report:view`, `document:download`, `document:view_confidential`.

Dos cosas fáciles de romper:

- **Permisos independientes no forman jerarquía.** Si dos permisos protegen dos dimensiones distintas de un recurso, tener uno no da acceso al otro; un recurso marcado con los dos exige los dos. No asumas "el más restrictivo".
- **Los permisos no se cachean en el token.** Quitarle un permiso a alguien con sesión abierta debe aplicar en la petición siguiente, sin cerrar la sesión. Se resuelven por petición; como mucho se memoizan dentro de la misma.

Forma prevista, con un `PermissionsGuard` global:

```typescript
@RequirePermissions({ permissions: ['document:download'] })
@RequirePermissions({ operator: 'OR', permissions: ['report:view', 'queue:review'] })
```

Para lógica condicional dentro del controller —filtrar resultados por lo que el usuario alcanza— se inyecta el snapshot ya resuelto con `@CurrentPermissions()`, sin consulta extra.
