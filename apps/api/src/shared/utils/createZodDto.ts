import { z } from 'zod';

export interface ZodDtoClass<T extends z.ZodType = z.ZodType> {
  new (...args: unknown[]): z.output<T>;
  schema: T;
}

export function createZodDto<T extends z.ZodType>(schema: T): ZodDtoClass<T> {
  // Tiene que ser una clase: Nest usa el metatype para resolver el pipe de validación.
  class ZodDto {
    static schema: T = schema;
  }
  return ZodDto as unknown as ZodDtoClass<T>;
}
