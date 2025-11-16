// TagPay-specific types
export interface TagPayCustomerResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  kyc_status: string;
  created_at: string;
  updated_at: string;
}

export interface TagPayWalletResponse {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TagPayBillResponse {
  id: string;
  biller_id: string;
  customer_reference: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string;
  reference: string;
}

export interface TagPayApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

