export const HTTP_STATUS = {
  // 2xx Success
  OK: { code: 200, message: 'OK' },
  CREATED: { code: 201, message: 'Created' },
  ACCEPTED: { code: 202, message: 'Accepted' },
  NO_CONTENT: { code: 204, message: 'No Content' },

  // 4xx Client Errors
  BAD_REQUEST: { code: 400, message: 'Bad Request' },
  UNAUTHORIZED: { code: 401, message: 'Unauthorized' },
  FORBIDDEN: { code: 403, message: 'Forbidden' },
  NOT_FOUND: { code: 404, message: 'Not Found' },
  METHOD_NOT_ALLOWED: { code: 405, message: 'Method Not Allowed' },
  CONFLICT: { code: 409, message: 'Conflict' },
  UNPROCESSABLE_ENTITY: { code: 422, message: 'Unprocessable Entity' },
  TOO_MANY_REQUESTS: { code: 429, message: 'Too Many Requests' },

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: { code: 500, message: 'Internal Server Error' },
  NOT_IMPLEMENTED: { code: 501, message: 'Not Implemented' },
  BAD_GATEWAY: { code: 502, message: 'Bad Gateway' },
  SERVICE_UNAVAILABLE: { code: 503, message: 'Service Unavailable' },
  GATEWAY_TIMEOUT: { code: 504, message: 'Gateway Timeout' },
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS]['code'];
export type HttpStatusMessage = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS]['message'];

// Helper function to get status message by code
export function getStatusMessage(code: number): string {
  const status = Object.values(HTTP_STATUS).find((s) => s.code === code);
  return status?.message || 'Unknown Status';
}

// Helper function to check if status code is client error (4xx)
export function isClientError(code: number): boolean {
  return code >= 400 && code < 500;
}

// Helper function to check if status code is server error (5xx)
export function isServerError(code: number): boolean {
  return code >= 500 && code < 600;
}
