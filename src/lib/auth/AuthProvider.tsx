"use client";

/**
 * Port di auth.service.ts:
 * - token + tokenValidUntil (now+24h) + userData persistiti in localStorage
 *   con le STESSE chiavi (`token`, `tokenValidUntil`, `userData`);
 * - isLogged() = isAuth && userData.contact && token && tokenValidUntil > now;
 * - endSession/logout svuotano TUTTO lo storage (parità: storage.clear());
 * - `ready` è aggiunto per React: i guard aspettano il loadSession del mount.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { storage } from "@/lib/storage";
import { convertStringToJSON, isset, trim } from "@/lib/helper";
import * as brokerstar from "@/lib/api/brokerstar";
import { setBrokerstarToken } from "@/lib/api/brokerstar";

export interface UserData {
  contact?: {
    id?: number;
    type?: number;
    name1?: string;
    name2?: string;
    isConsultant?: boolean | number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface AuthContextValue {
  /** true dopo il loadSession iniziale: i guard non decidono prima */
  ready: boolean;
  isAuth: boolean;
  userData: UserData;
  token: string;
  isLogged: () => boolean;
  startSession: (authData: { token: string }) => Promise<boolean>;
  endSession: () => void;
  logout: () => Promise<boolean>;
  getUserName: (type?: number, name1?: string, name2?: string) => string;
  refreshUserData: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [userData, setUserData] = useState<UserData>({});
  const [token, setToken] = useState("");
  const tokenValidUntil = useRef<Date>(new Date(0));

  const endSession = useCallback(() => {
    storage.removeItem("token");
    storage.removeItem("tokenValidUntil");
    storage.removeItem("userData");
    storage.clear();
    setIsAuth(false);
    setUserData({});
    setToken("");
    setBrokerstarToken("");
  }, []);

  // loadSession al mount (port di loadSession chiamato al bootstrap Angular)
  useEffect(() => {
    storage.clearOldVersions();
    try {
      const storedToken = storage.getItem("token");
      const storedValidUntil = new Date(storage.getItem("tokenValidUntil") || "");
      const storedUserData = convertStringToJSON<UserData>(
        storage.getItem("userData"),
        {},
      );
      if (storedUserData instanceof Object && isset(storedUserData, true)) {
        setToken(storedToken);
        tokenValidUntil.current = storedValidUntil;
        setUserData(storedUserData);
        setBrokerstarToken(storedToken);
        setIsAuth(true);
      } else if (storedToken) {
        endSession();
      }
    } catch (err) {
      console.error(err);
    }
    setReady(true);
  }, [endSession]);

  const isLogged = useCallback((): boolean => {
    return Boolean(
      isAuth && userData.contact && token && tokenValidUntil.current > new Date(),
    );
  }, [isAuth, userData, token]);

  const refreshUserData = useCallback(async (): Promise<boolean> => {
    const data = (await brokerstar.userMe()) as UserData;
    if (isset(data, true)) {
      setUserData(data);
      storage.setItem("userData", JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const startSession = useCallback(
    async (authData: { token: string }): Promise<boolean> => {
      const newToken = authData.token;
      setBrokerstarToken(newToken);

      // token valido 24h (parità)
      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + 24);

      const data = (await brokerstar.userMe()) as UserData;
      if (isset(data, true) && data.contact) {
        setToken(newToken);
        tokenValidUntil.current = validUntil;
        setUserData(data);
        setIsAuth(true);
        storage.setItem("token", newToken);
        storage.setItem("tokenValidUntil", validUntil.toUTCString());
        storage.setItem("userData", JSON.stringify(data));
        return true;
      }
      setBrokerstarToken("");
      return false;
    },
    [],
  );

  const logout = useCallback(async (): Promise<boolean> => {
    await brokerstar.logout();
    endSession();
    return true;
  }, [endSession]);

  const getUserName = useCallback(
    (type?: number, name1?: string, name2?: string): string => {
      if (!isset(type)) type = userData.contact?.type;
      if (!isset(name1)) name1 = userData.contact?.name1;
      if (!isset(name2)) name2 = userData.contact?.name2;
      if (!isset(name1)) name1 = "";
      if (!isset(name2)) name2 = "";
      if (type === 1) {
        return trim(`${String(name1)} ${String(name2)}`);
      }
      return trim(`${String(name2)} ${String(name1)}`);
    },
    [userData],
  );

  const value = useMemo(
    () => ({
      ready,
      isAuth,
      userData,
      token,
      isLogged,
      startSession,
      endSession,
      logout,
      getUserName,
      refreshUserData,
    }),
    [
      ready,
      isAuth,
      userData,
      token,
      isLogged,
      startSession,
      endSession,
      logout,
      getUserName,
      refreshUserData,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
