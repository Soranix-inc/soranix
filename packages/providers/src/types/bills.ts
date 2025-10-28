// Bills payment-related types

export interface Biller {
  id: string;
  name: string;
  category: BillerCategory;
  logo?: string;
  description?: string;
  isActive: boolean;
  supportedCountries: string[];
  supportedCurrencies: string[];
}

export enum BillerCategory {
  ELECTRICITY = 'electricity',
  WATER = 'water',
  INTERNET = 'internet',
  CABLE_TV = 'cable_tv',
  MOBILE_AIRTIME = 'mobile_airtime',
  MOBILE_DATA = 'mobile_data',
  INSURANCE = 'insurance',
  EDUCATION = 'education',
  GOVERNMENT = 'government',
  OTHER = 'other',
}

export interface BillPaymentData {
  billerId: string;
  customerReference: string; // e.g., meter number, account number
  amount: number;
  currency: string;
  customerPhone?: string;
  customerEmail?: string;
  description?: string;
  reference?: string;
}

export interface BillPaymentResult {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  customerReference: string;
  billerReference?: string;
  message: string;
  receipt?: string;
  timestamp: Date;
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface BillValidationData {
  billerId: string;
  customerReference: string;
}

export interface BillValidationResult {
  isValid: boolean;
  customerName?: string;
  amount?: number;
  currency?: string;
  dueDate?: Date;
  message: string;
}

export interface BillHistory {
  id: string;
  billerId: string;
  billerName: string;
  customerReference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt: Date;
  reference: string;
}

export interface GetBillersParams {
  category?: BillerCategory;
  country?: string;
  isActive?: boolean;
}
