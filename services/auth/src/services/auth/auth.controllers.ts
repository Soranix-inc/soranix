import { AuthService } from './auth.services.js';
import { asyncHandler } from '@packages/errors';
import { RegisterSchema } from './auth.types.js';

export class AuthControllers {
  private readonly authService: AuthService;

  constructor(service: AuthService) {
    this.authService = service;
  }

  public registerUser = asyncHandler(async (req, res) => {
    const validatedData = RegisterSchema.parse(req.body);
    const userAgent = req.get('user-agent') || 'unknown';

    const result = await this.authService.register(validatedData, userAgent);

    res.status(201).json(result);
  });

  public verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const result = await this.authService.verifyEmail(token);

    res.status(200).json(result);
  });
}
