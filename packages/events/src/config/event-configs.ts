import { registerEventConfigs } from '../types/base-event.js';
import { BILLS_EVENT_CONFIG } from '../types/bills-events.js';
import { PAYMENT_EVENT_CONFIG } from '../types/payment-events.js';
import { TRANSFER_EVENT_CONFIG } from '../types/transfer-events.js';
import { USER_EVENT_CONFIG } from '../types/user-events.js';

// Initialize all event configurations
export function initializeEventConfigs(): void {
  registerEventConfigs(PAYMENT_EVENT_CONFIG);
  registerEventConfigs(TRANSFER_EVENT_CONFIG);
  registerEventConfigs(BILLS_EVENT_CONFIG);
  registerEventConfigs(USER_EVENT_CONFIG);

  // Add AI and notification configs when they're created
  // registerEventConfigs(AI_EVENT_CONFIG);
  // registerEventConfigs(NOTIFICATION_EVENT_CONFIG);
}
