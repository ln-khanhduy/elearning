const ACCESS_TOKEN_KEY = 'elearning_access_token';

export const setAccessToken = (token) => {
  if (token) {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (e) {
      console.warn('Cannot save token to localStorage:', e);
    }
  }
};

export const getAccessToken = () => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (e) {
    return null;
  }
};

// Đăng xuất
export const clearAccessToken = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (e) {
    console.warn('Cannot clear token:', e);
  }
};

export const clearAuthSessionData = () => {
  clearAccessToken();

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
  return !!getAccessToken();
};
