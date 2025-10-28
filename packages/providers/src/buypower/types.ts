// BuyPower-specific types
export interface BuyPowerBillResponse {
  id: string;
  biller_id: string;
  customer_reference: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string;
  reference: string;
  merchant_id: string;
}

export interface BuyPowerBillerResponse {
  id: string;
  name: string;
  category: string;
  logo?: string;
  description?: string;
  is_active: boolean;
  supported_countries: string[];
  supported_currencies: string[];
}

export interface BuyPowerApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}
