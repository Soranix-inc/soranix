import TransactionsControllers from './transactions.controllers';
import TransactionsRoutes from './transactions.routes';
import TransactionsServices from './transactions.services';

class TransactionsModules {
  public services: TransactionsServices;
  public controllers: TransactionsControllers;
  public routes: TransactionsRoutes;

  constructor() {
    this.services = new TransactionsServices();
    this.controllers = new TransactionsControllers();
    this.routes = new TransactionsRoutes(this.controllers);
  }
}

export default TransactionsModules;

