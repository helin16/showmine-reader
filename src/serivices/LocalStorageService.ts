const getTokenName = () => {
  return process.env.NEXT_PUBLIC_LOCAL_USER_TOKEN_NAME || 'token';
};

const getJsConfigCache = () => {
  return process.env.NEXT_PUBLIC_LOCAL_JS_CONFIG || 'jssdk';
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

// Not the token above, which AppService sends on every call.
const COMMENT_TOKEN_NAME = 'commentToken';

const getCommentToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(COMMENT_TOKEN_NAME);
  }
};

const setCommentToken = (newToken: string) => {
  if (typeof window !== 'undefined') {
    return localStorage.setItem(COMMENT_TOKEN_NAME, newToken);
  }
};

const removeCommentToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.removeItem(COMMENT_TOKEN_NAME);
  }
};

const getJsSdk = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(getJsConfigCache());
  }
};

const setJsSdk = (newObjJson: string) => {
  if (typeof window !== 'undefined') {
    return localStorage.setItem(getJsConfigCache(), newObjJson);
  }
};

const removeJsSdk = () => {
  if (typeof window !== 'undefined') {
    return localStorage.removeItem(getJsConfigCache());
  }
};

const LocalStorageService = {
  getToken,
  setToken,
  removeToken,

  getCommentToken,
  setCommentToken,
  removeCommentToken,

  getJsSdk,
  setJsSdk,
  removeJsSdk
};

export default LocalStorageService;
