import express from 'express';

import ProfileControllers from './profile.controllers';

class ProfileRoutes {
  private readonly router: express.Router;

  constructor(private readonly controller: ProfileControllers) {
    this.router = express.Router();
  }

  routes = () => {
    // All profile routes require authentication (handled by gateway)

    // Get own profile (using authenticated user ID)
    this.router.get('/me', this.controller.getMyProfile);

    // Get profile by ID (admin or self only)
    this.router.get('/:userId', this.controller.getProfile);

    // Update own profile
    this.router.put('/me', this.controller.updateMyProfile);

    // Update profile by ID (admin only)
    this.router.put('/:userId', this.controller.updateProfile);

    // Delete profile (admin only)
    this.router.delete('/:userId', this.controller.deleteProfile);

    return this.router;
  };
}

export default ProfileRoutes;
