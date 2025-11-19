// client/src/config/api.config.js
// Create this file to centralize API configuration

const getApiBaseUrl = () => {
  // Check if running in development
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  
  // Production - use environment variable or deployed backend URL
  return import.meta.env.VITE_API_BASE_URL || 'https://api.bhartiyadharohar.in';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  // Website/Public endpoints
  enquiry: `${API_BASE_URL}/api/website/enquiry`,
  notice: `${API_BASE_URL}/api/website/notice`,
  
  // Auth endpoints
  auth: `${API_BASE_URL}/auth`,
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  
  // Admin endpoints
  products: `${API_BASE_URL}/products`,
  medicine: `${API_BASE_URL}/medicine`,
  
  // Operations endpoints
  sales: `${API_BASE_URL}/api/sale`,
  purchase: `${API_BASE_URL}/api/purchase`,
  closingStock: `${API_BASE_URL}/api/closing-stock`,
  
  // Health check
  health: `${API_BASE_URL}/health`,
};

export default API_BASE_URL;