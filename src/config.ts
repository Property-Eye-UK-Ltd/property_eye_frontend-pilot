export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  AGENCY: {
    LIST: '/agencies',
    CREATE: '/agencies',
    STATS: '/agencies/stats',
  },
  DOCUMENTS: {
    UPLOAD: '/documents/upload',
    LISTINGS: '/documents/listings',
  },
  FRAUD: {
    SCAN: '/fraud/scan',
    REPORTS: '/fraud/reports',
  },
  VERIFICATION: {
    VERIFY: '/verification/verify',
  },
  PPD: {
    UPLOAD: '/ppd/upload',
    UPLOADS: '/ppd/uploads',
  },
};
