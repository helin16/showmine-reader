import AppService from '@/serivices/AppService';

const endPoint = '/weChat';

const getWeChatJsConfig = AppService.get(`${endPoint}/js/conf/reader`);

const WeChatService = {
  getWeChatJsConfig
};

export default WeChatService;
