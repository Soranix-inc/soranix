import express from 'express';

import ProfileModules from '../profile/profile.modules';

class RootModules {
  private readonly router: express.Router;
  public readonly profile: ProfileModules;

  constructor() {
    this.router = express.Router();
    this.profile = new ProfileModules();
    this.intializaRoutes();
  }

  public intializaRoutes() {
    this.router.use('/profile', this.profile.routes.routes());
    return this.router;
  }

  routes() {
    return this.router;
  }
}

export default RootModules;

