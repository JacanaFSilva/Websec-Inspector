import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("websec_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("websec_token");
    }
    return Promise.reject(err);
  },
);

export interface Finding {
  id: number;
  owaspCategory: string;
  description: string;
  cvssScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation: string;
}

export interface ScanResponse {
  id: number;
  hostname: string;
  status: "PENDING_VERIFICATION" | "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  verificationToken: string | null;
  createdAt: string;
  finishedAt: string | null;
  findings: Finding[];
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data as { token: string };
}

export async function register(name: string, email: string, password: string) {
  const { data } = await api.post("/auth/register", { name, email, password });
  return data as { token: string };
}

export async function submitScan(url: string) {
  const { data } = await api.post("/scans", { url });
  return data as ScanResponse;
}

export async function confirmVerification(scanId: number) {
  const { data } = await api.post(`/scans/${scanId}/confirm-verification`);
  return data as ScanResponse;
}

export async function getScan(scanId: number) {
  const { data } = await api.get(`/scans/${scanId}`);
  return data as ScanResponse;
}
