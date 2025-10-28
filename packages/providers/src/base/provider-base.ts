import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import { systemLogger } from '@packages/logging';

import { BaseProviderConfig, ApiResponse, ProviderError, RequestOptions, RetryConfig } from '../types/common.js';

export abstract class ProviderBase {
  protected config: BaseProviderConfig;
  protected httpClient: AxiosInstance;
  protected retryConfig: RetryConfig;

  constructor(config: BaseProviderConfig) {
    this.config = config;
    this.retryConfig = {
      maxRetries: config.retries || 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    };

    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        systemLogger.debug('Provider request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          provider: this.getProviderName(),
        });
        return config;
      },
      (error) => {
        systemLogger.error('Provider request error', {
          error: error.message,
          provider: this.getProviderName(),
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        systemLogger.debug('Provider response', {
          status: response.status,
          url: response.config.url,
          provider: this.getProviderName(),
        });
        return response;
      },
      (error) => {
        systemLogger.error('Provider response error', {
          status: error.response?.status,
          url: error.config?.url,
          provider: this.getProviderName(),
          error: error.message,
        });
        return Promise.reject(this.handleError(error));
      }
    );
  }

  protected async makeRequest<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
    const { method, endpoint, data, params, headers, timeout } = options;

    const requestConfig: AxiosRequestConfig = {
      method,
      url: endpoint,
      data,
      params,
      headers: {
        ...this.httpClient.defaults.headers,
        ...headers,
      },
      timeout: timeout || this.config.timeout,
    };

    try {
      const response: AxiosResponse<T> = await this.httpClient.request(requestConfig);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected async makeRequestWithRetry<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.makeRequest<T>(options);
      } catch (error) {
        lastError = error;

        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        if (this.retryConfig.retryCondition && !this.retryConfig.retryCondition(error)) {
          break;
        }

        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
        systemLogger.warn('Provider request retry', {
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
          delay,
          provider: this.getProviderName(),
        });

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  protected handleError(error: any): ProviderError {
    const providerError: ProviderError = new Error(
      error.response?.data?.message || error.message || 'Provider request failed'
    ) as ProviderError;

    providerError.code = error.response?.data?.code || error.code;
    providerError.statusCode = error.response?.status;
    providerError.provider = this.getProviderName();
    providerError.details = error.response?.data;

    return providerError;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await this.makeRequest({
        method: 'GET',
        endpoint: '/health',
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  public abstract getProviderName(): string;
}
