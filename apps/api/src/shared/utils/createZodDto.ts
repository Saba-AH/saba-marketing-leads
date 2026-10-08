import { z } from 'zod';

export interface ZodDtoClass<T extends z.ZodType = z.ZodType> {
  new (...args: unknown[]): z.output<T>;
  schema: T;
}

export function createZodDto<T extends z.ZodType>(schema: T): ZodDtoClass<T> {
  // It has to be a class: Nest uses the metatype to resolve the validation pipe.
  class ZodDto {
    static schema: T = schema;
  }
  return ZodDto as unknown as ZodDtoClass<T>;
}
