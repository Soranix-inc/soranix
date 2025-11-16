import { DomainEvent, EventConfig, EventPriority, DeliveryGuarantee, EventMetadata } from './base-event.js';

// AI Events
export interface AIAnalysisData {
  analysisId: string;
  userId: string;
  analysisType: string;
  inputData: any;
  metadata?: Record<string, any>;
}

export class AIAnalysisRequestedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    data: AIAnalysisData,
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ) {
    super('ai.analysis.requested', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: true,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}

export class AIAnalysisCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    data: AIAnalysisData & {
      results: any;
      completedAt: Date;
      processingTime: number;
      confidence?: number;
    },
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ) {
    super('ai.analysis.completed', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: true,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}

export class AIRecommendationGeneratedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    data: {
      recommendationId: string;
      userId: string;
      recommendationType: string;
      recommendations: any[];
      confidence: number;
      metadata?: Record<string, any>;
    },
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ) {
    super('ai.recommendation.generated', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: true,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}

export class AIInsightCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    data: {
      insightId: string;
      userId: string;
      insightType: string;
      insight: any;
      confidence: number;
      metadata?: Record<string, any>;
    },
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ) {
    super('ai.insight.created', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: true,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}

export class AIPredictionUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    data: {
      predictionId: string;
      userId: string;
      predictionType: string;
      prediction: any;
      accuracy: number;
      updatedAt: Date;
      metadata?: Record<string, any>;
    },
    options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
  ) {
    super('ai.prediction.updated', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: true,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}

