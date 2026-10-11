export const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


export function getAuthHeaders(): HeadersInit {
  const token = sessionStorage.getItem("access_token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}