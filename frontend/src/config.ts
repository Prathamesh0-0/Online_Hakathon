const getDefaultApiUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  return 'https://meeting-copilot-backend-5okc.onrender.com';
};

const rawApiUrl = import.meta.env.VITE_API_URL || getDefaultApiUrl();

const getFormattedApiUrl = (url: string) => {
  let cleaned = url.trim();
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
};

export const API_URL = getFormattedApiUrl(rawApiUrl);
