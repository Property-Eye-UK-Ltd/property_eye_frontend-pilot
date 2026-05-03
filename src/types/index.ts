export interface AgencyStats {
  total_listings: number;
  suspicious_matches: number;
  confirmed_fraud: number;
  potential_savings: number;
}

export interface Agency {
  id: string;
  name: string;
  created_at: string;
}

export interface FraudReport {
  id: string;
  property_listing_id: string;
  property_address: string;
  client_name: string | null;
  vendor_name?: string | null;
  withdrawn_date: string;
  ppd_transaction_id?: string;
  ppd_price?: number;
  ppd_transfer_date?: string;
  ppd_postcode?: string;
  ppd_full_address?: string;
  confidence_score: number;
  address_similarity: number;
  risk_level?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  verification_status: 'suspicious' | 'confirmed_fraud' | 'not_fraud' | 'error';
  verified_owner_name?: string;
  is_confirmed_fraud: boolean;
  detected_at: string;
  verified_at?: string;
}

export interface UploadStats {
  upload_id: string;
  status: string;
  records_processed: number;
  records_skipped: number;
  message: string;
}

export interface PPDJob {
  upload_id: string;
  filename: string;
  year: number;
  month: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  records_processed: number;
  error_message?: string;
  uploaded_at: string;
  processed_at?: string;
}

export interface VerificationResult {
  match_id: string;
  property_address: string;
  client_name: string | null;
  vendor_name?: string | null;
  verification_status: 'confirmed_fraud' | 'not_fraud' | 'error';
  verified_owner_name: string | null;
  is_confirmed_fraud: boolean;
  verified_at: string;
  error_message: string | null;
}

export interface VerificationSummary {
  total_verified: number;
  confirmed_fraud_count: number;
  not_fraud_count: number;
  error_count: number;
  results: VerificationResult[];
  message: string;
}

export interface PropertyListing {
  id: string;
  address: string;
  postcode: string | null;
  region: string | null;
  county: string | null;
  property_number: string | null;
  title_number: string | null;
  client_name: string | null;
  vendor_name: string | null;
  status: string | null;
  withdrawn_date: string | null;
  price: string | null;
  commission: string | null;
  contract_duration: string | null;
  created_at: string;
}
