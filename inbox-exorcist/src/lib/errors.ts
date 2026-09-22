import type { ApiErrorEnvelope, ApiSuccessEnvelope } from "./domain.ts";

export class AppError extends Error {
  code: string;
  retryable: boolean;
  status: number;
  degraded: boolean;

  constructor({
    code,
    message,
    retryable = false,
    status = 400,
    degraded = false,
  }: {
    code: string;
    message: string;
    retryable?: boolean;
    status?: number;
    degraded?: boolean;
  }) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.status = status;
    this.degraded = degraded;
  }
}

export function errorEnvelope(error: AppError): ApiErrorEnvelope {
  return {
    ok: false,
    code: error.code,
    message: error.message,
    retryable: error.retryable,
    degraded: error.degraded || undefined,
  };
}

export function okEnvelope<T>(
  data: T,
  options: Omit<ApiSuccessEnvelope<T>, "ok" | "data"> = {},
): ApiSuccessEnvelope<T> {
  return { ok: true, data, ...options };
}

export function unknownErrorEnvelope(): ApiErrorEnvelope {
  return {
    ok: false,
    code: "INTERNAL_ERROR",
    message: "Something went wrong. No inbox data was stored from this failure.",
    retryable: true,
    degraded: true,
  };
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError({
    code: "INTERNAL_ERROR",
    message: "Something went wrong. No inbox data was stored from this failure.",
    retryable: true,
    status: 500,
    degraded: true,
  });
}
