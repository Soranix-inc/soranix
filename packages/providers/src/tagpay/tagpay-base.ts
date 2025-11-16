import { ProviderBase } from '../base/provider-base.js';

import { TagPayConfig } from './config.js';

export abstract class TagPayBase extends ProviderBase {
  protected tagpayConfig: TagPayConfig;

  constructor(config: TagPayConfig) {
    super(config);
    this.tagpayConfig = config;
  }

  public getProviderName(): string {
    return 'TagPay';
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

