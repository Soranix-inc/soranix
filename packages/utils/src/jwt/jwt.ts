import jwt from 'jsonwebtoken';

export interface JWTPayload {
  sub: string;
  email: string;
  roles?: string[];
  sessionId?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}

export interface JWTOptions {
  expiresIn?: string | number;
  issuer?: string;
  audience?: string | string[];
}

export interface JWTVerifyResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

export class JWT {
  private secret: string;
  private defaultOptions: {
    expiresIn: string | number;
    issuer: string;
    audience: string | string[];
  };

  constructor(secret?: string, options?: JWTOptions) {
    this.secret = secret || process.env.JWT_SECRET || '';
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    this.defaultOptions = {
      expiresIn: options?.expiresIn || process.env.JWT_EXPIRES_IN || '7d',
      issuer: options?.issuer || process.env.JWT_ISSUER || 'soranix-auth',
      audience: options?.audience || process.env.JWT_AUDIENCE?.split(',') || ['soranix'],
    };
  }

  sign(payload: Omit<JWTPayload, 'iat' | 'exp'>, options?: JWTOptions): string {
    const expiresIn = options?.expiresIn ?? this.defaultOptions.expiresIn;
    const audience = options?.audience || this.defaultOptions.audience;

    const signOptions: jwt.SignOptions = {
      algorithm: 'HS256',
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
      issuer: options?.issuer || this.defaultOptions.issuer,
      audience: audience as jwt.SignOptions['audience'],
    };

    try {
      return jwt.sign(payload, this.secret, signOptions);
    } catch (error) {
      throw new Error(`Failed to sign JWT: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  verify(token: string, options?: JWTOptions): JWTVerifyResult {
    const audience = options?.audience || this.defaultOptions.audience;

    const verifyOptions: jwt.VerifyOptions = {
      algorithms: ['HS256'],
      issuer: options?.issuer || this.defaultOptions.issuer,
      audience: audience as jwt.VerifyOptions['audience'],
    };

    try {
      const decoded = jwt.verify(token, this.secret, verifyOptions) as JWTPayload;
      return {
        valid: true,
        payload: decoded,
      };
    } catch (error) {
      let errorMessage = 'Invalid token';

      if (error instanceof jwt.TokenExpiredError) {
        errorMessage = 'Token has expired';
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorMessage = error.message;
      } else if (error instanceof jwt.NotBeforeError) {
        errorMessage = 'Token not yet valid';
      }

      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  verifyOrThrow(token: string, options?: JWTOptions): JWTPayload {
    const result = this.verify(token, options);
    if (!result.valid || !result.payload) {
      throw new Error(result.error || 'Invalid token');
    }
    return result.payload;
  }

  decode(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}
