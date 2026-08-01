import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getAuthSessionApi, refreshTokenApi } from "../api/authAPI";
import {
  clearAuthSessionData,
  getAccessToken,
  setAccessToken as saveAccessToken,
} from "../utils/authToken";

const UserContext = createContext();

// Provider quản lý trạng thái người dùng và token toàn cục cho toàn bộ ứng dụng
export function UserProvider({ children }) {
  const hasLoadedRef = useRef(false);

  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lưu access token vào state và localStorage
  const setAccessToken = (token) => {
    setAccessTokenState(token || null);

    if (token) {
      saveAccessToken(token);
    }
  };

  // Xóa toàn bộ dữ liệu phiên đăng nhập (token + user)
  const clearUserSession = () => {
    clearAuthSessionData();
    setAccessTokenState(null);
    setUser(null);
  };

  const loadUser = async () => {
    // Luôn thử refresh token từ httpOnly cookie để đảm bảo access token
    // còn hạn hoặc được cấp mới. Xử lý được trường hợp access token cũ
    // còn trong localStorage nhưng đã hết hạn sau 15 phút.
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

  // Tải lại thông tin người dùng (dùng sau khi cập nhật hồ sơ)
  const reloadUser = async () => {
    setLoading(true);
    await loadUser();
  };

  // Chỉ tải người dùng một lần khi component mount
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

// Hook tiện ích để truy cập context người dùng từ bất kỳ component nào
export const useUser = () => useContext(UserContext);
