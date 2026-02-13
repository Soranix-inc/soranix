import BalanceControllers from './balance.controllers.js';
import BalanceRoutes from './balance.routes.js';
import BalanceServices from './balance.services.js';

class BalanceModules {
  public services: BalanceServices;
  public controllers: BalanceControllers;
  public routes: BalanceRoutes;

  constructor() {
    this.services = new BalanceServices();
    this.controllers = new BalanceControllers();
    this.routes = new BalanceRoutes(this.controllers);
  }
}

export default BalanceModules;



