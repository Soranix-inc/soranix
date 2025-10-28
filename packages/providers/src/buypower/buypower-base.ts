import { ProviderBase } from '../base/provider-base.js';

import { BuyPowerConfig } from './config.js';

export abstract class BuyPowerBase extends ProviderBase {
  protected buypowerConfig: BuyPowerConfig;

  constructor(config: BuyPowerConfig) {
    super(config);
    this.buypowerConfig = config;
  }

  public getProviderName(): string {
    return 'BuyPower';
  }

  protected getEndpoint(endpoint: string, params?: Record<string, string>): string {
    let url = endpoint;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, value);
      });
    }
    return url;
  }
}
