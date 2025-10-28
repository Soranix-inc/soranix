// Base event interface
export interface BaseEvent {
  event: string;
  properties: Record<string, any>;
  timestamp?: Date;
  distinct_id: string;
}

// User Events
export interface UserRegisteredEvent extends BaseEvent {
  event: 'User Registered';
  properties: {
    email: string;
    registration_method: 'email' | 'google' | 'apple' | 'phone';
    source: string;
    user_id: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    trace_id?: string;
    span_id?: string;
  };
}

export interface UserLoginEvent extends BaseEvent {
  event: 'User Login';
  properties: {
    email: string;
    login_method: 'email' | 'google' | 'apple' | 'phone';
    user_id: string;
    ip_address?: string;
    user_agent?: string;
    trace_id?: string;
    span_id?: string;
  };
}

export interface UserProfileUpdatedEvent extends BaseEvent {
  event: 'User Profile Updated';
  properties: {
    user_id: string;
    updated_fields: string[];
    previous_values?: Record<string, any>;
    trace_id?: string;
    span_id?: string;
  };
}

// Payment Events
export interface PaymentInitiatedEvent extends BaseEvent {
  event: 'Payment Initiated';
  properties: {
    user_id: string;
    amount: number;
    currency: string;
    payment_method: 'credit_card' | 'bank_transfer' | 'wallet' | 'crypto';
    payment_provider: 'tagpay' | 'paystack' | 'stripe';
    transaction_id: string;
    trace_id?: string;
    span_id?: string;
  };
}

export interface PaymentCompletedEvent extends BaseEvent {
  event: 'Payment Completed';
  properties: {
    user_id: string;
    amount: number;
    currency: string;
    payment_method: string;
    payment_provider: string;
    transaction_id: string;
    processing_time_ms: number;
    trace_id?: string;
    span_id?: string;
  };
}

export interface PaymentFailedEvent extends BaseEvent {
  event: 'Payment Failed';
  properties: {
    user_id: string;
    amount: number;
    currency: string;
    payment_method: string;
    payment_provider: string;
    transaction_id: string;
    failure_reason: string;
    error_code?: string;
    trace_id?: string;
    span_id?: string;
  };
}

// Banking Events
export interface BankAccountConnectedEvent extends BaseEvent {
  event: 'Bank Account Connected';
  properties: {
    user_id: string;
    bank_name: string;
    account_type: 'checking' | 'savings' | 'business';
    country: string;
    trace_id?: string;
    span_id?: string;
  };
}

export interface TransferInitiatedEvent extends BaseEvent {
  event: 'Transfer Initiated';
  properties: {
    user_id: string;
    from_account: string;
    to_account: string;
    amount: number;
    currency: string;
    transfer_type: 'internal' | 'external' | 'international';
    trace_id?: string;
    span_id?: string;
  };
}

// Bills Payment Events
export interface BillPaymentInitiatedEvent extends BaseEvent {
  event: 'Bill Payment Initiated';
  properties: {
    user_id: string;
    biller_name: string;
    biller_category: 'electricity' | 'water' | 'internet' | 'mobile' | 'cable' | 'other';
    amount: number;
    currency: string;
    payment_provider: 'tagpay' | 'buypower';
    customer_reference: string;
    trace_id?: string;
    span_id?: string;
  };
}

export interface BillPaymentCompletedEvent extends BaseEvent {
  event: 'Bill Payment Completed';
  properties: {
    user_id: string;
    biller_name: string;
    biller_category: string;
    amount: number;
    currency: string;
    payment_provider: string;
    customer_reference: string;
    transaction_id: string;
    processing_time_ms: number;
    trace_id?: string;
    span_id?: string;
  };
}

// AI Events
export interface AIInsightGeneratedEvent extends BaseEvent {
  event: 'AI Insight Generated';
  properties: {
    user_id: string;
    insight_type: 'spending_analysis' | 'budget_recommendation' | 'savings_opportunity' | 'risk_assessment';
    confidence_score: number;
    processing_time_ms: number;
    data_points_analyzed: number;
    trace_id?: string;
    span_id?: string;
  };
}

// System Events
export interface APICallEvent extends BaseEvent {
  event: 'API Call';
  properties: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    status_code: number;
    response_time_ms: number;
    user_id?: string;
    service: string;
    trace_id?: string;
    span_id?: string;
  };
}

// Union type for all events
export type SoranixEvent =
  | UserRegisteredEvent
  | UserLoginEvent
  | UserProfileUpdatedEvent
  | PaymentInitiatedEvent
  | PaymentCompletedEvent
  | PaymentFailedEvent
  | BankAccountConnectedEvent
  | TransferInitiatedEvent
  | BillPaymentInitiatedEvent
  | BillPaymentCompletedEvent
  | AIInsightGeneratedEvent
  | APICallEvent;

// Event categories for organization
export const EVENT_CATEGORIES = {
  USER: 'user',
  PAYMENT: 'payment',
  BANKING: 'banking',
  BILLS: 'bills',
  AI: 'ai',
  SYSTEM: 'system',
} as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[keyof typeof EVENT_CATEGORIES];
