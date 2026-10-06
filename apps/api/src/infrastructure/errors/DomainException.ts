/**
 * Base de toda excepción de dominio: el mensaje ES el código
 * (`<MODULO>_<SCREAMING_SNAKE>`), nunca texto para humanos — la traducción
 * ocurre solo en `DomainExceptionFilter` (`.claude/rules/errors.md`).
 */
export abstract class DomainException extends Error {
  constructor(code: string, cause?: unknown) {
    super(code);
    this.name = new.target.name;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}
