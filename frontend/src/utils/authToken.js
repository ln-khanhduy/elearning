const ACCESS_TOKEN_KEY = 'elearning_access_token';

export const setAccessToken = (token) => {
  if (token) {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (e) {
      console.warn('Không thể lưu token vào localStorage:', e);
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

// Xóa access token khi đăng xuất
export const clearAccessToken = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (e) {
      console.warn('Không thể xóa token:', e);
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
    console.warn('Không thể xóa dữ liệu phiên đăng nhập:', error);
  }
};

// Kiểm tra trạng thái đã đăng nhập hay chưa
export const isAuthenticated = () => {
  return !!getAccessToken();
};
