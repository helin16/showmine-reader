import AppService, { iConfigParams } from '@/serivices/AppService';

const endPoint = '/weChat';

const getWeChatJsConfig = (params?: iConfigParams, config?: iConfigParams) =>
  AppService.get(`${endPoint}/js/conf/reader`, params, config).then(
    resp => resp.data
  );

export const isInWeChat = () =>
  /(micromessenger|webbrowser)/.test(navigator.userAgent.toLocaleLowerCase());

const WeChatService = {
  getWeChatJsConfig,
  isInWeChat
};

export default WeChatService;
