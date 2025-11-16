import BillsControllers from './bills.controllers';
import BillsRoutes from './bills.routes';
import BillsServices from './bills.services';

class BillsModules {
  public services: BillsServices;
  public controllers: BillsControllers;
  public routes: BillsRoutes;

  constructor() {
    this.services = new BillsServices();
    this.controllers = new BillsControllers();
    this.routes = new BillsRoutes(this.controllers);
  }
}

export default BillsModules;

