let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Đăng xuất
export const clearAccessToken = () => {
  accessToken = null;
};

export const clearAuthSessionData = () => {
  accessToken = null;

  try {
    sessionStorage.removeItem('register_email');
    sessionStorage.removeItem('reset_email');
    sessionStorage.removeItem('reset_token');
    sessionStorage.removeItem('current_user');
    sessionStorage.removeItem('user');
  } catch (error) {
    console.warn('Unable to clear auth session data:', error);
  }
};

// check login
export const isAuthenticated = () => {
  return !!accessToken;
};
