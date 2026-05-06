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

export interface FraudReportGroup {
  group_key: string;
  property_address: string;
  postcode?: string | null;
  property_number?: string | null;
  total_matches: number;
  highest_confidence_score: number;
  risk_level?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  latest_transfer_date?: string | null;
  suspicious_count: number;
  confirmed_fraud_count: number;
  cleared_count: number;
  error_count: number;
  items: FraudReport[];
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

export interface AdminFraudCase {
  id: string;
  property_listing_id: string;
  agency_id: string;
  agency_name: string;
  property_address: string;
  title_number?: string | null;
  client_name?: string | null;
  vendor_name?: string | null;
  price?: string | null;
  postcode?: string | null;
  withdrawn_date?: string | null;
  confidence_score: number;
  risk_level?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null;
  verification_status: "suspicious" | "confirmed_fraud" | "not_fraud" | "error";
  verified_owner_name?: string | null;
  is_confirmed_fraud: boolean;
  detected_at: string;
  verified_at?: string | null;
  register_extract_status?: string | null;
  register_extract_fetched_at?: string | null;
}

export interface AdminFraudCaseDetail extends AdminFraudCase {
  ppd_transaction_id?: string | null;
  ppd_price?: number | null;
  ppd_transfer_date?: string | null;
  ppd_postcode?: string | null;
  ppd_full_address?: string | null;
  address_similarity: number;
  land_registry_response?: string | null;
}

export interface AdminFraudCaseListResponse {
  items: AdminFraudCase[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminAgencyFilter {
  id: string;
  name: string;
}

export interface RegisterExtractProperty {
  address?: string | null;
  tenure?: string | null;
  description?: string | null;
}

export interface RegisterExtractProprietor {
  name?: string | null;
  type?: string | null;
  address?: string | null;
  mismatch: boolean;
}

export interface RegisterExtractEntry {
  entry_number?: string | null;
  entry_text?: string | null;
  registration_date?: string | null;
  raw: Record<string, unknown>;
}

export interface RegisterExtractResponse {
  report_id: string;
  title_number?: string | null;
  fetched_at: string;
  status: string;
  property: RegisterExtractProperty;
  proprietors: RegisterExtractProprietor[];
  charges: RegisterExtractEntry[];
  restrictions: RegisterExtractEntry[];
  leases: RegisterExtractEntry[];
  notices: RegisterExtractEntry[];
  quick_reference_flags: string[];
  official_copy_available: boolean;
  error_message?: string | null;
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
