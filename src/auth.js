const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ACCESS_TOKEN_KEYS = ['access_token', 'auth_access_token', 'token'];
const USER_KEYS = ['auth_user', 'currentUser', 'user'];

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const readJson = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

export const getApiBaseUrl = () => API_BASE_URL;

export const getStoredAccessToken = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  for (const key of ACCESS_TOKEN_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value) {
      return value;
    }
  }

  return '';
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  for (const key of USER_KEYS) {
    const parsed = readJson(window.localStorage.getItem(key));
    if (parsed) {
      return parsed;
    }
  }

  return null;
};

export const persistAuthUser = (user) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('auth_user', JSON.stringify(user));
};

export const persistAccessToken = (token) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('access_token', token);
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  ACCESS_TOKEN_KEYS.forEach((key) => window.localStorage.removeItem(key));
  USER_KEYS.forEach((key) => window.localStorage.removeItem(key));
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || data?.error || 'Yêu cầu thất bại';
    throw new ApiError(message, response.status, data);
  }

  return data;
};

const getAuthHeader = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

const requestWithRefresh = async (path, options = {}, token = getStoredAccessToken()) => {
  try {
    return await request(path, {
      ...options,
      headers: {
        ...getAuthHeader(token),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error.status !== 401 || !token) {
      throw error;
    }

    const refreshedToken = await refreshCurrentSession(token);

    return request(path, {
      ...options,
      headers: {
        ...getAuthHeader(refreshedToken),
        ...(options.headers || {}),
      },
    });
  }
};

export const fetchCurrentUser = async (token) => {
  const response = await requestWithRefresh('/api/auth/me', {
    method: 'GET',
  }, token);

  return response?.data?.user || null;
};

export const sendActivityHeartbeat = async (token = getStoredAccessToken()) => {
  if (!token) {
    return false;
  }

  const response = await requestWithRefresh('/api/auth/heartbeat', {
    method: 'POST',
  }, token);

  return response === true;
};

const sha256Hex = async (value) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const loginWithCredentials = async ({ identifier, password }) => {
  const hashedPassword = await sha256Hex(password);
  const trimmedIdentifier = identifier.trim();
  const isEmail = trimmedIdentifier.includes('@');

  const payload = isEmail
    ? { email: trimmedIdentifier, password: hashedPassword }
    : { mssv: trimmedIdentifier, password: hashedPassword };

  const response = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const user = response?.data?.user || null;
  const accessToken = response?.data?.access_token || '';

  if (accessToken) {
    persistAccessToken(accessToken);
  }

  if (user) {
    persistAuthUser(user);
  }

  return {
    user,
    accessToken,
  };
};

export const registerWithCredentials = async ({ email, password, fullName, className }) => {
  const hashedPassword = await sha256Hex(password);

  const response = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim(),
      password: hashedPassword,
      full_name: fullName.trim(),
      class_name: className.trim(),
    }),
  });

  return response?.data?.user || null;
};

export const sendForgotPasswordEmail = async (email) => {
  const response = await request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });

  return response?.message || 'Nếu email tồn tại, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.';
};

export const verifyResetPasswordToken = async (token) => {
  const query = new URLSearchParams({ token: token.trim() }).toString();
  const response = await request(`/api/auth/verify-reset-token?${query}`, {
    method: 'GET',
  });

  return Boolean(response?.valid || response?.success);
};

export const resetPasswordWithToken = async ({ token, password, confirmPassword }) => {
  const hashedPassword = await sha256Hex(password);
  const hashedConfirmPassword = await sha256Hex(confirmPassword);

  const response = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token: token.trim(),
      password: hashedPassword,
      confirmPassword: hashedConfirmPassword,
    }),
  });

  return response?.message || 'Đặt lại mật khẩu thành công.';
};

export const refreshCurrentSession = async (token = getStoredAccessToken()) => {
  const response = await request('/api/auth/refresh-token', {
    method: 'POST',
    headers: getAuthHeader(token),
  });

  const accessToken = response?.data?.access_token || '';

  if (!accessToken) {
    throw new Error('Không làm mới được phiên đăng nhập.');
  }

  persistAccessToken(accessToken);
  return accessToken;
};

export const sendOverdueEmailAPI = async ({ exerciseTitle, courseName, overdueLabel, deadline }) => {
  const response = await requestWithRefresh('/api/exercises/send-overdue-email', {
    method: 'POST',
    body: JSON.stringify({ exerciseTitle, courseName, overdueLabel, deadline }),
  });

  return response;
};

export const logoutCurrentSession = async (token) => {
  if (!token) {
    clearAuthSession();
    return;
  }

  await requestWithRefresh('/api/auth/logout', {
    method: 'POST',
  }, token);
};
