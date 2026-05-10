export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    CHANGE_PASSWORD: "/auth/change-password",
  },
  AGENCY: {
    LIST: "/agencies",
    CREATE: "/agencies",
    STATS: "/agencies/stats",
  },
  DOCUMENTS: {
    UPLOAD: "/documents/upload",
    INGEST: "/documents/ingest",
    LISTINGS: "/documents/listings",
    UPDATE_LISTING: (id: string) => `/documents/listings/${id}`,
    DELETE_LISTING: (id: string) => `/documents/listings/${id}`,
  },
  FRAUD: {
    SCAN: "/fraud/scan",
    REPORTS: "/fraud/reports",
    GROUPED_REPORTS: "/fraud/reports/grouped",
    UPDATE_REPORT: (id: string) => `/fraud/reports/${id}`,
    DELETE_REPORT: (id: string) => `/fraud/reports/${id}`,
  },
  VERIFICATION: {
    VERIFY: "/verification/verify",
    STATUS: (id: string) => `/verification/status/${id}`,
    VERIFY_LISTING: (id: string) => `/verification/verify-listing/${id}`,
  },
  PPD: {
    UPLOAD: "/ppd/upload",
    UPLOADS: "/ppd/uploads",
    REUPLOAD: (id: string) => `/ppd/upload/${id}/reupload`,
  },
  ADMIN: {
    ALTO_AGENCIES: "/admin/alto-agencies",
    FRAUD_REPORTS: "/admin/fraud-reports",
    FRAUD_REPORT: (id: string) => `/admin/fraud-reports/${id}`,
    FRAUD_REPORT_AGENCIES: "/admin/fraud-reports/agencies",
    REGISTER_EXTRACT: (id: string) => `/admin/fraud-reports/${id}/register-extract`,
    REGISTER_EXTRACT_PDF: (id: string) =>
      `/admin/fraud-reports/${id}/register-extract/pdf`,
  },
  INTEGRATIONS: {
    ALTO_IMPORT: "/integrations/alto/import",
  },
};
