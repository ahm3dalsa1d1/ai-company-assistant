import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type {
  ReactNode
} from "react";

import {
  getCurrentUser,
  logout as logoutService,
} from "../services/auth";

import type { User } from "../types";


interface AuthContextType {
  user: User | null;
  loading: boolean;

  refreshUser: () => Promise<void>;
  logout: () => void;
}


const AuthContext =
  createContext<AuthContextType | null>(
    null
  );


export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);


  async function refreshUser() {
    const token =
      sessionStorage.getItem(
        "access_token"
      );

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser =
        await getCurrentUser();

      setUser(currentUser);

    } catch {
      sessionStorage.removeItem(
        "access_token"
      );

      setUser(null);

    } finally {
      setLoading(false);
    }
  }


  function logout() {
    logoutService();
    setUser(null);
  }


  useEffect(() => {
    refreshUser();
  }, []);


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}