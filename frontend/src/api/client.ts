import axios from "axios";

export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

api.interceptors.request.use((config) => {
  const csrfToken = getCookie("csrftoken");
  if (csrfToken && config.headers) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
});

// Auto-fetch CSRF token on startup
export async function initCsrf() {
  try {
    await api.get("/auth/csrf/");
  } catch (err) {
    console.error("Failed to fetch initial CSRF token", err);
  }
}
