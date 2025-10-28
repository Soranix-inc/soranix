// User properties for Mixpanel people profiles
export interface UserProperties {
  $email?: string;
  $first_name?: string;
  $last_name?: string;
  $phone?: string;
  $created?: Date;
  $last_login?: Date;

  // Custom properties
  registration_method?: 'email' | 'google' | 'apple' | 'phone';
  source?: string;
  country?: string;
  timezone?: string;
  language?: string;

  // Financial properties
  total_transactions?: number;
  total_spent?: number;
  preferred_currency?: string;
  kyc_status?: 'pending' | 'verified' | 'rejected';

  // Behavioral properties
  last_active?: Date;
  login_count?: number;
  preferred_payment_method?: string;

  // System properties
  service_version?: string;
  environment?: string;
}

// Event properties that can be added to any event
export interface CommonEventProperties {
  // Trace correlation
  trace_id?: string;
  span_id?: string;

  // User context
  user_id?: string;
  session_id?: string;

  // Request context
  request_id?: string;
  service?: string;
  version?: string;

  // Environment
  environment?: string;
  deployment?: string;

  // Timing
  timestamp?: Date;
  processing_time_ms?: number;
}

// Device and browser properties
export interface DeviceProperties {
  $os?: string;
  $os_version?: string;
  $browser?: string;
  $browser_version?: string;
  $device?: string;
  $screen_width?: number;
  $screen_height?: number;
  $app_version?: string;
  $app_build?: string;
}

// Location properties
export interface LocationProperties {
  $city?: string;
  $region?: string;
  $country?: string;
  $timezone?: string;
  $ip?: string;
}
