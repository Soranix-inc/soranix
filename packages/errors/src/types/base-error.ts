export interface ErrorContext {
  [key: string]: any;
}

export interface ErrorOptions {
  context?: ErrorContext;
  cause?: Error;
  isOperational?: boolean;
  traceId?: string;
  spanId?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    traceId?: string;
    spanId?: string;
    context?: ErrorContext;
  };
  request: {
    id?: string;
    method: string;
    path: string;
    timestamp: string;
  };
}

export interface ErrorConfig {
  environment: 'development' | 'staging' | 'production';
  includeContext: boolean;
  includeStack: boolean;
  logErrors: boolean;
  trackMetrics: boolean;
  sanitizeErrors: boolean;
}
