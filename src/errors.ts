export class QuickQuizError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'QuickQuizError';
    this.code = code;
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, QuickQuizError.prototype);
  }
}
