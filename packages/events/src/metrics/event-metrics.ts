import { systemLogger } from '@packages/logging';

export interface EventMetrics {
  eventType: string;
  published: number;
  consumed: number;
  failed: number;
  averageProcessingTime: number;
  lastProcessedAt?: Date;
}

export class EventMetricsCollector {
  private metrics = new Map<string, EventMetrics>();
  private processingTimes = new Map<string, number[]>();

  recordEventPublished(eventType: string): void {
    const current = this.metrics.get(eventType) || this.createEmptyMetrics(eventType);
    current.published++;
    this.metrics.set(eventType, current);

    systemLogger.debug('Event published metric recorded', { eventType, total: current.published });
  }

  recordEventConsumed(eventType: string, processingTime: number): void {
    const current = this.metrics.get(eventType) || this.createEmptyMetrics(eventType);
    current.consumed++;
    current.lastProcessedAt = new Date();

    // Track processing times for average calculation
    const times = this.processingTimes.get(eventType) || [];
    times.push(processingTime);

    // Keep only last 100 processing times to avoid memory issues
    if (times.length > 100) {
      times.shift();
    }

    this.processingTimes.set(eventType, times);
    current.averageProcessingTime = this.calculateAverage(times);

    this.metrics.set(eventType, current);

    systemLogger.debug('Event consumed metric recorded', {
      eventType,
      total: current.consumed,
      processingTime,
      averageProcessingTime: current.averageProcessingTime,
    });
  }

  recordEventFailed(eventType: string): void {
    const current = this.metrics.get(eventType) || this.createEmptyMetrics(eventType);
    current.failed++;
    this.metrics.set(eventType, current);

    systemLogger.warn('Event failed metric recorded', { eventType, total: current.failed });
  }

  getMetrics(eventType?: string): EventMetrics | Map<string, EventMetrics> {
    if (eventType) {
      return this.metrics.get(eventType) || this.createEmptyMetrics(eventType);
    }
    return new Map(this.metrics);
  }

  getMetricsSummary(): {
    totalEvents: number;
    totalPublished: number;
    totalConsumed: number;
    totalFailed: number;
    eventTypes: string[];
  } {
    let totalPublished = 0;
    let totalConsumed = 0;
    let totalFailed = 0;
    const eventTypes: string[] = [];

    for (const [eventType, metrics] of this.metrics) {
      eventTypes.push(eventType);
      totalPublished += metrics.published;
      totalConsumed += metrics.consumed;
      totalFailed += metrics.failed;
    }

    return {
      totalEvents: this.metrics.size,
      totalPublished,
      totalConsumed,
      totalFailed,
      eventTypes,
    };
  }

  resetMetrics(eventType?: string): void {
    if (eventType) {
      this.metrics.delete(eventType);
      this.processingTimes.delete(eventType);
      systemLogger.info('Metrics reset for event type', { eventType });
    } else {
      this.metrics.clear();
      this.processingTimes.clear();
      systemLogger.info('All metrics reset');
    }
  }

  private createEmptyMetrics(eventType: string): EventMetrics {
    return {
      eventType,
      published: 0,
      consumed: 0,
      failed: 0,
      averageProcessingTime: 0,
    };
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
}

// Singleton instance
export const eventMetrics = new EventMetricsCollector();
