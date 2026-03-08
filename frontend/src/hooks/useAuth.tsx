import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { api } from "@/lib/api";

interface AuthCtx {
  token: string | null;
  username: string | null;
  login: (u: string, p: string) => Promise<void>;
  register: (u: string, p: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("username"));

  const handleAuth = useCallback((t: string, u: string) => {
    localStorage.setItem("token", t);
    localStorage.setItem("username", u);
    setToken(t);
    setUsername(u);
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const res = await api.login(u, p);
    handleAuth(res.access_token, res.username);
  }, [handleAuth]);

  const register = useCallback(async (u: string, p: string) => {
    const res = await api.register(u, p);
    handleAuth(res.access_token, res.username);
  }, [handleAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, username, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
