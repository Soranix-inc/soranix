import EntriesControllers from './entries.controllers.js';
import EntriesRoutes from './entries.routes.js';
import EntriesServices from './entries.services.js';

class EntriesModules {
  public services: EntriesServices;
  public controllers: EntriesControllers;
  public routes: EntriesRoutes;

  constructor() {
    this.services = new EntriesServices();
    this.controllers = new EntriesControllers();
    this.routes = new EntriesRoutes(this.controllers);
  }
}

export default EntriesModules;

