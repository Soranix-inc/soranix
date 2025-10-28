import { getTraceId, getSpanId } from '@packages/tracing';

import { ErrorOptions, ErrorContext } from '../types/base-error.js';

export class SoranixError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: ErrorContext;
  public readonly cause?: Error;
  public readonly traceId?: string;
  public readonly spanId?: string;

  constructor(code: string, message: string, statusCode: number = 500, options?: ErrorOptions) {
    super(message);

    // Set error properties
    this.name = 'SoranixError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = options?.isOperational ?? true;
    this.timestamp = new Date();
    this.context = options?.context;
    this.cause = options?.cause;

    // Add trace correlation if available
    this.traceId = options?.traceId || getTraceId();
    this.spanId = options?.spanId || getSpanId();

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, SoranixError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SoranixError);
    }
  }

  /**
   * Convert error to JSON representation
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp.toISOString(),
      traceId: this.traceId,
      spanId: this.spanId,
      context: this.context,
      cause: this.cause?.message,
      stack: this.stack,
    };
  }

  /**
   * Check if error is a SoranixError
   */
  static isSoranixError(error: any): error is SoranixError {
    return error instanceof SoranixError;
  }

  /**
   * Create a new SoranixError from an existing error
   */
  static fromError(error: Error, code: string, statusCode: number = 500, options?: ErrorOptions): SoranixError {
    return new SoranixError(code, error.message, statusCode, {
      ...options,
      cause: error,
    });
  }
}
