export interface MixpanelConfig {
  token: string;
  environment: 'development' | 'staging' | 'production';
  enabled: boolean;
  batchSize?: number;
  flushInterval?: number;
  debug?: boolean;
  ip?: boolean;
  agent?: string;
}

export const getMixpanelConfig = (): MixpanelConfig => {
  return {
    token: process.env.MIXPANEL_TOKEN || '',
    environment: (process.env.NODE_ENV as any) || 'development',
    enabled: process.env.MIXPANEL_ENABLED !== 'false',
    batchSize: parseInt(process.env.MIXPANEL_BATCH_SIZE || '50'),
    flushInterval: parseInt(process.env.MIXPANEL_FLUSH_INTERVAL || '10000'),
    debug: process.env.MIXPANEL_DEBUG === 'true',
    ip: process.env.MIXPANEL_IP !== 'false',
    agent: process.env.MIXPANEL_AGENT || 'soranix-analytics',
  };
};



