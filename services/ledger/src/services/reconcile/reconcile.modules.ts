import ReconcileControllers from './reconcile.controllers.js';
import ReconcileRoutes from './reconcile.routes.js';
import ReconcileServices from './reconcile.services.js';

class ReconcileModules {
  public services: ReconcileServices;
  public controllers: ReconcileControllers;
  public routes: ReconcileRoutes;

  constructor() {
    this.services = new ReconcileServices();
    this.controllers = new ReconcileControllers();
    this.routes = new ReconcileRoutes(this.controllers);
  }
}

export default ReconcileModules;

