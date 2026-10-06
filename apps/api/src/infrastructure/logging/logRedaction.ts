const REDACTED = '[REDACTED]';

const SENSITIVE_KEY_PATTERN =
  /(password|contrase|secret|token|authorization|api[-_]?key|signature|credential)/i;

// Bearer JWT u opaco, con o sin nombre de cabecera antes ("Authorization: Bearer x", "header: Bearer x").
const BEARER_TOKEN_PATTERN = /Bearer\s+[^\s"',;]+/gi;

// Otros esquemas de credenciales por cabecera que no usan "Bearer" (Basic,
// Token, Digest, X-API-Key...). El `(?:[A-Za-z]+\s+)?` come el esquema —sea cual
// sea— antes del secreto, así que se tapa el valor completo y no solo la palabra
// del esquema. El bearer ya lo tapa BEARER_TOKEN_PATTERN; se excluye acá para no
// partir su reemplazo en dos.
const CREDENTIAL_HEADER_PATTERN =
  /(authorization|x-api-key|api[-_]?key|x-auth-token)(\s*[:=]\s*)(?!bearer\b)(?:[A-Za-z]+\s+)?[^\s"',;]+/gi;

// Coincide con URLs firmadas de Cloud Storage/S3: preserva origen y ruta,
// tapa la query donde va la firma (X-Goog-Signature, Signature, Expires...).
const SIGNED_URL_QUERY_PATTERN =
  /(https?:\/\/[^\s"'?]+)\?[^\s"']*(?:signature|expires|token)[^\s"']*/gi;

/**
 * Ningún log ni mensaje de error debe imprimir tokens, contraseñas ni URLs
 * firmadas completas (`.claude/rules/errors.md`). Recorre el valor: tapa
 * valores de claves sensibles y sanitiza patrones conocidos dentro de strings.
 */
export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') {
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }
  if (value !== null && typeof value === 'object') {
    if (seen.has(value)) {
      return REDACTED;
    }
    seen.add(value);
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(entryValue, seen),
      ])
    );
  }
  return value;
}

function redactString(text: string): string {
  return text
    .replace(SIGNED_URL_QUERY_PATTERN, '$1?[REDACTED]')
    .replace(BEARER_TOKEN_PATTERN, 'Bearer [REDACTED]')
    .replace(CREDENTIAL_HEADER_PATTERN, '$1$2[REDACTED]');
}
