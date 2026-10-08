/** `{ success: false, ... }` envelope produced by the global filters (E00·10). */
export interface ErrorResponseBody {
  success: false;
  error: string;
  code: string;
  correlationId?: string;
  timestamp: string;
  path: string;
}

export function buildErrorResponseBody(params: {
  code: string;
  message: string;
  path: string;
  correlationId?: string;
}): ErrorResponseBody {
  return {
    success: false,
    error: params.message,
    code: params.code,
    correlationId: params.correlationId,
    timestamp: new Date().toISOString(),
    path: params.path,
  };
}
