"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  image: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const GOOGLE_CLIENT_ID = "923683353586-gd8aoemj92jc3t6cbs44da8iqnipvc70.apps.googleusercontent.com";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 恢复登录状态
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }
    setIsLoading(false);

    // 加载 Google Identity Services
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  function handleCredentialResponse(response: any) {
    // 解码 JWT token
    const payload = JSON.parse(atob(response.credential.split(".")[1]));
    const userData: User = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      image: payload.picture,
    };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  }

  function signIn() {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem("user");
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// 扩展 window 类型
declare global {
  interface Window {
    google: any;
  }
}
