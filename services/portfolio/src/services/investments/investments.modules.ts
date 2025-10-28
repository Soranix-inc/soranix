import InvestmentsControllers from './investments.controllers';
import InvestmentsRoutes from './investments.routes';
import InvestmentsServices from './investments.services';

class InvestmentsModules {
  public services: InvestmentsServices;
  public controllers: InvestmentsControllers;
  public routes: InvestmentsRoutes;

  constructor() {
    this.services = new InvestmentsServices();
    this.controllers = new InvestmentsControllers();
    this.routes = new InvestmentsRoutes(this.controllers);
  }
}

export default InvestmentsModules;
