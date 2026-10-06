# Validación de datos con Zod

## Reglas obligatorias

1. **Tipado en runtime**: todo dato entrante debe validarse con **Zod** en el borde. Las fuentes son: **formularios**, **variables de entorno** y **respuestas de la API**. El acceso a datos de dominio pasa por `apps/api`; el cliente siempre parsea la respuesta contra el esquema compartido de `packages/schemas`.
2. **Inferencia de tipos**: no crees `interface` ni `type` manuales para estructuras ya validadas. Usa `z.infer<typeof schema>`.
3. **Ubicación de los esquemas**:
   - **El contrato de la API vive en `packages/schemas`** (lo comparten el cliente y `apps/api`). Un endpoint nuevo define su esquema ahí; el cliente lo parsea al recibir la respuesta.
   - Los esquemas **locales de una feature** (validación de un formulario que no cruza la API) viven en `features/[feature]/`. Lo compartido entre features, en `shared/`.

```typescript
import { z } from 'zod';

// Schema
export const createUserSchema = z.object({
  email: z.string().email('Correo inválido'),
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  role: z.enum(['admin', 'user']).default('user'),
});

// Tipo inferido
export type CreateUserInput = z.infer<typeof createUserSchema>;
```
