const getTokenName = () => {
  return process.env.NEXT_PUBLIC_LOCAL_USER_TOKEN_NAME || 'token';
};

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(getTokenName());
  }
};

const setToken = (newToken: string) => {
  if (typeof window !== 'undefined') {
    return localStorage.setItem(getTokenName(), newToken);
  }
};

const removeToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.removeItem(getTokenName());
  }
};

const LocalStorageService = {
  getToken,
  setToken,
  removeToken,
};

export default LocalStorageService;
