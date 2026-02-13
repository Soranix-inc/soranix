import CoreControllers from './core.controllers.js';
import CoreRoutes from './core.routes.js';
import CoreServices from './core.services.js';

class CoreModules {
  public services: CoreServices;
  public controllers: CoreControllers;
  public routes: CoreRoutes;

  constructor() {
    this.services = new CoreServices();
    this.controllers = new CoreControllers();
    this.routes = new CoreRoutes(this.controllers);
  }
}

export default CoreModules;



