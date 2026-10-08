/**
 * Base of every domain exception: the message IS the code
 * (`<MODULE>_<SCREAMING_SNAKE>`), never text for humans — translation happens
 * only in `DomainExceptionFilter` (`.claude/rules/errors.md`).
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
