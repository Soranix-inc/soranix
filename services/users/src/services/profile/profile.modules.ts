import ProfileControllers from './profile.controllers';
import ProfileRoutes from './profile.routes';
import ProfileServices from './profile.services';

class ProfileModules {
  public services: ProfileServices;
  public controllers: ProfileControllers;
  public routes: ProfileRoutes;

  constructor() {
    this.services = new ProfileServices();
    this.controllers = new ProfileControllers();
    this.routes = new ProfileRoutes(this.controllers);
  }
}

export default ProfileModules;

