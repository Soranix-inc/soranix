import type { ServiceRegistry } from '../types/gateway.types.js';

export const serviceRegistry: ServiceRegistry = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:6000',
  users: process.env.USERS_SERVICE_URL || 'http://localhost:6001',
  banking: process.env.BANKING_SERVICE_URL || 'http://localhost:5003',
  payments: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:5005',
  ledger: process.env.LEDGER_SERVICE_URL || 'http://localhost:6002',
  portfolio: process.env.PORTFOLIO_SERVICE_URL || 'http://localhost:5010',
  billsPayment: process.env.BILLS_PAYMENT_SERVICE_URL || 'http://localhost:5004',
  transfers: process.env.TRANSFERS_SERVICE_URL || 'http://localhost:5006',
  flows: process.env.FLOWS_SERVICE_URL || 'http://localhost:5007',
  moneyManagement: process.env.MONEY_MANAGEMENT_SERVICE_URL || 'http://localhost:5008',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5009',
  billing: process.env.BILLING_SERVICE_URL || 'http://localhost:5011',
  ai: process.env.AI_SERVICE_URL || 'http://localhost:5006',
};

export function getServiceUrl(serviceName: string): string | null {
  return serviceRegistry[serviceName] || null;
}

export function validateServiceRegistry(): void {
  const requiredServices = ['auth', 'users', 'banking', 'payments', 'ledger', 'portfolio', 'billsPayment', 'transfers'];

  const missingServices: string[] = [];

  for (const service of requiredServices) {
    if (!serviceRegistry[service]) {
      missingServices.push(service);
    }
  }

  if (missingServices.length > 0) {
    console.warn(`Warning: Missing service URLs for: ${missingServices.join(', ')}`);
  }
}
