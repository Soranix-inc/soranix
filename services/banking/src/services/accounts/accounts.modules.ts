import AccountsControllers from './accounts.controllers';
import AccountsRoutes from './accounts.routes';
import AccountsServices from './accounts.services';

class AccountsModules {
  public services: AccountsServices;
  public controllers: AccountsControllers;
  public routes: AccountsRoutes;

  constructor() {
    this.services = new AccountsServices();
    this.controllers = new AccountsControllers();
    this.routes = new AccountsRoutes(this.controllers);
  }
}

export default AccountsModules;

