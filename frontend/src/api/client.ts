import axios from "axios";

let memoryCsrfToken: string | null =
  (typeof window !== "undefined" && (window as any).__CSRF_TOKEN__) || null;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function getCsrfToken(): string | null {
  return (
    getCookie("csrftoken") ||
    memoryCsrfToken ||
    (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("csrftoken") : null) ||
    (typeof window !== "undefined" ? (window as any).__CSRF_TOKEN__ : null)
  );
}

export function setCsrfToken(token: string) {
  if (!token) return;
  memoryCsrfToken = token;
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem("csrftoken", token);
    } catch {
      // ignore
    }
  }
  if (api.defaults.headers.common) {
    api.defaults.headers.common["X-CSRFToken"] = token;
  }
}

export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use((config) => {
  const token = getCsrfToken();
  if (token && config.headers) {
    config.headers["X-CSRFToken"] = token;
  }
  return config;
});

// Auto-retry once on 403 CSRF token error
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isCsrfError =
      error.response?.status === 403 &&
      (typeof error.response?.data?.detail === "string" &&
        error.response.data.detail.toLowerCase().includes("csrf"));

    if (isCsrfError && originalRequest && !originalRequest._retryCsrf) {
      originalRequest._retryCsrf = true;
      try {
        const res = await axios.get("/api/v1/auth/csrf/", { withCredentials: true });
        if (res.data?.csrfToken) {
          setCsrfToken(res.data.csrfToken);
          if (originalRequest.headers) {
            originalRequest.headers["X-CSRFToken"] = res.data.csrfToken;
          }
          return api(originalRequest);
        }
      } catch (retryErr) {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// Auto-fetch CSRF token on startup
export async function initCsrf() {
  try {
    const res = await api.get("/auth/csrf/");
    if (res.data?.csrfToken) {
      setCsrfToken(res.data.csrfToken);
    }
  } catch (err) {
    console.error("Failed to fetch initial CSRF token", err);
  }
}
