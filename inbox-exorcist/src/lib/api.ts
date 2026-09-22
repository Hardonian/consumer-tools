import { NextResponse } from "next/server";

import { AppError, errorEnvelope, okEnvelope, toAppError } from "./errors.ts";

export function jsonOk<T>(
  data: T,
  init: { status?: number; degraded?: boolean } = {},
) {
  return NextResponse.json(okEnvelope(data, { degraded: init.degraded }), {
    status: init.status || 200,
  });
}

export function jsonError(error: AppError) {
  return NextResponse.json(errorEnvelope(error), { status: error.status });
}

export function handleApiError(error: unknown) {
  return jsonError(toAppError(error));
}

export async function readJsonBody<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AppError({
      code: "INVALID_JSON",
      message: "Request body must be valid JSON.",
      status: 400,
    });
  }
}
