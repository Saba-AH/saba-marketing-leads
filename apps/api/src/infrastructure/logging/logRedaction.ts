const REDACTED = '[REDACTED]';

const SENSITIVE_KEY_PATTERN =
  /(password|contrase|secret|token|authorization|api[-_]?key|signature|credential)/i;

// Bearer JWT or opaque token, with or without a header name before it ("Authorization: Bearer x", "header: Bearer x").
const BEARER_TOKEN_PATTERN = /Bearer\s+[^\s"',;]+/gi;

// Other header credential schemes that do not use "Bearer" (Basic, Token,
// Digest, X-API-Key...). The `(?:[A-Za-z]+\s+)?` eats the scheme —whatever it
// is— before the secret, so the whole value is masked and not just the scheme
// word. BEARER_TOKEN_PATTERN already masks bearer; it is excluded here so its
// replacement is not split in two.
const CREDENTIAL_HEADER_PATTERN =
  /(authorization|x-api-key|api[-_]?key|x-auth-token)(\s*[:=]\s*)(?!bearer\b)(?:[A-Za-z]+\s+)?[^\s"',;]+/gi;

// Matches Cloud Storage/S3 signed URLs: keeps origin and path, masks the query
// where the signature goes (X-Goog-Signature, Signature, Expires...).
const SIGNED_URL_QUERY_PATTERN =
  /(https?:\/\/[^\s"'?]+)\?[^\s"']*(?:signature|expires|token)[^\s"']*/gi;

/**
 * No log or error message may print tokens, passwords or full signed URLs
 * (`.claude/rules/errors.md`). Walks the value: masks the values of sensitive
 * keys and sanitizes known patterns inside strings.
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
