import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getAuthSessionApi } from "../api/authAPI";
import {
  clearAuthSessionData,
  setAccessToken as saveAccessToken,
} from "../utils/authToken";

const UserContext = createContext();

export function UserProvider({ children }) {
  const hasLoadedRef = useRef(false);

  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAccessToken = (token) => {
    setAccessTokenState(token || null);

    if (token) {
      saveAccessToken(token);
    }
  };

  const clearUserSession = () => {
    clearAuthSessionData();
    setAccessTokenState(null);
    setUser(null);
  };

  const loadUser = async () => {
    try {
      const data = await getAuthSessionApi();

      setAccessToken(data.access);
      setUser(data.user);
    } catch (error) {
      clearUserSession();
    } finally {
      setLoading(false);
    }
  };

  const reloadUser = async () => {
    setLoading(true);
    await loadUser();
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;

    hasLoadedRef.current = true;
    loadUser();
  }, []);

  const value = {
    user,
    setUser,
    accessToken,
    setAccessToken,
    loading,
    isAuthenticated: !!user,
    reloadUser,
    clearUserSession,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);