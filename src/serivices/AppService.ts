import axios, { AxiosRequestConfig } from 'axios';
import LocalStorageService from './LocalStorageService';

const getHeaderCompanyIdName = () => {
  return `${process.env.NEXT_PUBLIC_HEADER_NAME_COMPANY_ID || 'comid'}`;
};

const getHeaderAppTokenName = () => {
  return `${process.env.NEXT_PUBLIC_HEADER_NAME_APP_TOKEN || 'X-SHM-TOKEN'}`;
};
export type iConfigParams = {
  [key: string]: any;
};
export type iParams = {
  [key: string]: string | boolean | number | null | undefined | string[];
};

const getEndPointUrl = (url: string) => {
  return `${process.env.NEXT_PUBLIC_API_END_POINT}${url}`;
};

// Lets reader pages past the API's limit per address, as they all reach it from Vercel's shared ones.
// Never NEXT_PUBLIC_: that would put it in the browser's code, and it would then be no secret.
const getServerKeyHeader = () => {
  const serverKey = `${process.env.SHOWMINE_SERVER_KEY || ''}`.trim();
  return typeof window !== 'undefined' || serverKey === ''
    ? {}
    : { 'X-SHM-SERVER-KEY': serverKey };
};

const getHeaders = (extra = {}) => {
  const token = LocalStorageService.getToken();
  const authHeader =
    !token || token === '' ? {} : { Authorization: `Bearer ${token}` };
  return {
    headers: {
      [getHeaderAppTokenName()]: `${process.env.NEXT_PUBLIC_APP_TOKEN || ''}`,
      ...authHeader,
      ...getServerKeyHeader(),
      ...extra
    }
  };
};

const getUrlParams = (params: iConfigParams = {}) => {
  const paramString =
    typeof params === 'object' && Object.keys(params).length > 0
      ? new URLSearchParams(params).toString()
      : '';
  return paramString === '' ? '' : `?${paramString}`;
};

const get = (
  url: string,
  params: iConfigParams = {},
  config: AxiosRequestConfig = {}
) => {
  const { headers, ...rest } = config;
  return axios.get(
    `${getEndPointUrl(url)}${getUrlParams(params)}`,
    // @ts-ignore
    {
      ...rest,
      ...getHeaders(headers)
    }
  );
};

const post = (
  url: string,
  params: iParams,
  config: AxiosRequestConfig = {}
) => {
  const { headers, ...rest } = config;
  // @ts-ignore
  return axios.post(getEndPointUrl(url), params, {
    ...rest,
    ...getHeaders(headers)
  });
};

const put = (
  url: string,
  params: iConfigParams,
  config: AxiosRequestConfig = {}
) => {
  // @ts-ignore
  return axios.put(getEndPointUrl(url), params, {
    ...config,
    ...getHeaders()
  });
};

const remove = (
  url: string,
  params: iConfigParams = {},
  config: AxiosRequestConfig = {}
) => {
  return axios.delete(
    `${getEndPointUrl(url)}${getUrlParams(params)}`,
    // @ts-ignore
    {
      ...config,
      ...getHeaders()
    }
  );
};
const getUploadHeaders = () => {
  const headers = getHeaders();
  return {
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data'
    }
  };
};
const uploadImage = (
  url: string,
  params: FormData,
  config: AxiosRequestConfig = {}
) => {
  // @ts-ignore
  return axios.post(getEndPointUrl(url), params, {
    ...config,
    ...getUploadHeaders()
  });
};

const AppService = {
  getHeaderCompanyIdName,
  getHeaderAppTokenName,
  get,
  post,
  put,
  delete: remove,
  uploadImage
};

export default AppService;
