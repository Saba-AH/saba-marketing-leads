import {
  ApiBody,
  ApiResponse,
  type ApiResponseSchemaHost,
} from '@nestjs/swagger';
import { z } from 'zod';

/**
 * `SchemaObject` cannot be imported directly: @nestjs/swagger's `exports` does
 * not expose `dist/interfaces/*`. It is derived from the decorator's public type.
 */
type SwaggerSchema = ApiResponseSchemaHost['schema'];

function toSwaggerSchema(schema: z.ZodType): SwaggerSchema {
  return z.toJSONSchema(schema, {
    // turns unrepresentable pieces (transforms) into "any"
    unrepresentable: 'any',
    // often helpful with pipelines: documents input shape
    io: 'input',
  }) as unknown as SwaggerSchema;
}

export function ZodApiBody(schema: z.ZodType): MethodDecorator {
  return ApiBody({ schema: toSwaggerSchema(schema) });
}

export function ZodApiResponse(
  status: number,
  schema: z.ZodType,
  description?: string
): MethodDecorator {
  return ApiResponse({
    status,
    description,
    schema: toSwaggerSchema(schema),
  });
}
