# Estándares de TypeScript

## Reglas de rigurosidad

1. **Sin `any`**: está prohibido el tipo `any`. Para datos impredecibles, usa `unknown` seguido de validación con Zod.
2. **Manejo de errores**: en bloques `catch (error)`, trata la variable como `unknown` y valida con `error instanceof Error`.
3. **Tipos e interfaces**:
   - Usa `type` para alias de tipos, uniones, intersecciones y tipos derivados de Zod (`z.infer`).
   - Usa `interface` para extensión de contratos de objetos complejos o APIs públicas.

```typescript
// ❌ PROHIBIDO
try {
  // ...
} catch (e: any) {
  console.log(e.message);
}

// ✅ OBLIGATORIO
try {
  // ...
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```
