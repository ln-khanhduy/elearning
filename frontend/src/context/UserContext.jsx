import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getAuthSessionApi, refreshTokenApi } from "../api/authAPI";
import {
  clearAuthSessionData,
  getAccessToken,
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
    // Nếu không có access token trong memory (sau khi refresh trang),
    // thử refresh token từ httpOnly cookie trước
    if (!getAccessToken()) {
      try {
        const refreshRes = await refreshTokenApi();
        if (refreshRes?.access) {
          setAccessToken(refreshRes.access);
        } else {
          // Không refresh được -> chưa đăng nhập
          setUser(null);
          setLoading(false);
          return;
        }
      } catch {
        // Refresh thất bại (không có refresh token cookie) -> chưa đăng nhập
        setUser(null);
        setLoading(false);
        return;
      }
    }

    try {
      const data = await getAuthSessionApi();

      if (data) {
        setAccessToken(data.access);
        setUser(data.user);
      } else {
        // API trả về null (401) -> chưa đăng nhập
        clearUserSession();
      }
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
