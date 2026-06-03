import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { refreshTokenApi } from "../../api/authAPI";
import { clearAuthSessionData, setAccessToken } from "../../utils/authToken";
import { useAuth } from "../../context/UserContext";

function OAuthSuccessPage() {
  const navigate = useNavigate();
  const { reloadUser } = useAuth();

  useEffect(() => {
    const authenticate = async () => {
      try {
        clearAuthSessionData();
        const response = await refreshTokenApi();

        setAccessToken(response.access);
        await reloadUser();
        navigate("/home", { replace: true });
      } catch (error) {
        navigate("/login", { replace: true });
      }
    };

    authenticate();
  }, [navigate, reloadUser]);

  return (
    <div className="text-center mt-5">
      <h3>Đang đăng nhập...</h3>
    </div>
  );
}

export default OAuthSuccessPage;