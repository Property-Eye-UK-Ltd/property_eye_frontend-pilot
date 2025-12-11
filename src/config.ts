export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  AGENCY: {
    LIST: "/agencies",
    CREATE: "/agencies",
    STATS: "/agencies/stats",
  },
  DOCUMENTS: {
    UPLOAD: "/documents/upload",
    LISTINGS: "/documents/listings",
    UPDATE_LISTING: (id: string) => `/documents/listings/${id}`,
    DELETE_LISTING: (id: string) => `/documents/listings/${id}`,
  },
  FRAUD: {
    SCAN: "/fraud/scan",
    REPORTS: "/fraud/reports",
    UPDATE_REPORT: (id: string) => `/fraud/reports/${id}`,
    DELETE_REPORT: (id: string) => `/fraud/reports/${id}`,
  },
  VERIFICATION: {
    VERIFY: "/verification/verify",
  },
  PPD: {
    UPLOAD: "/ppd/upload",
    UPLOADS: "/ppd/uploads",
  },
  ADMIN: {
    ALTO_AGENCIES: "/admin/alto-agencies",
  },
  INTEGRATIONS: {
    ALTO_IMPORT: "/integrations/alto/import",
  },
};
