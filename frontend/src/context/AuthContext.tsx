import React, { createContext, useContext, useState } from "react";
import { login as apiLogin, register as apiRegister } from "../services/api";

interface AuthContextValue {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("websec_token")
  );

  async function login(email: string, password: string) {
    const { token } = await apiLogin(email, password);
    localStorage.setItem("websec_token", token);
    setToken(token);
  }

  async function register(name: string, email: string, password: string) {
    const { token } = await apiRegister(name, email, password);
    localStorage.setItem("websec_token", token);
    setToken(token);
  }

  function logout() {
    localStorage.removeItem("websec_token");
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
