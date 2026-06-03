import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUserApi } from "../api/userAPI";
import { refreshTokenApi } from "../api/authAPI";
import { getAccessToken, setAccessToken } from "../utils/authToken";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    setLoading(true);

    try {
      let token = getAccessToken();

      if (!token) {
        const tokenResponse = await refreshTokenApi();
        token = tokenResponse?.access;

        if (token) {
          setAccessToken(token);
        }
      }

      if (!token) {
        setUser(null);
        return;
      }

      const currentUser = await getCurrentUserApi();
      setUser(currentUser);
    } catch (error) {
      console.error(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, reloadUser: loadUser, isAuthenticated: !!user }}>
      {children}
    </UserContext.Provider>
  );
}

export const useAuth = () => useContext(UserContext);