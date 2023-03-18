import AppService, { iConfigParams } from '@/serivices/AppService';
// @ts-ignore
import WechatJSSDK from 'wechat-jssdk/dist/client.umd';

const endPoint = '/weChat';
let wechatObj: any = null;

const getWeChatJsConfig = (
  url: string,
  params?: iConfigParams,
  config?: iConfigParams
) =>
  AppService.post(`${endPoint}/js/conf`, { url, ...params }, config).then(
    resp => resp.data
  );

const getWX = async () => {
  if (window && !wechatObj) {
    const result = await getWeChatJsConfig(window.location.href || '');
    wechatObj = new WechatJSSDK({
      ...result,
      debug: true
      // jsApiList: [
      //   'checkJsApi',
      //   'onMenuShareTimeline',
      //   'onMenuShareAppMessage',
      //   'hideMenuItems',
      //   'showMenuItems',
      //   'hideAllNonBaseMenuItem',
      //   'showAllNonBaseMenuItem',
      //   'translateVoice',
      //   'startRecord',
      //   'stopRecord',
      //   'onVoiceRecordEnd',
      //   'playVoice',
      //   'onVoicePlayEnd',
      //   'pauseVoice',
      //   'stopVoice',
      //   'uploadVoice',
      //   'downloadVoice',
      //   'chooseImage',
      //   'previewImage',
      //   'uploadImage',
      //   'downloadImage',
      //   'getNetworkType',
      //   'openLocation',
      //   'getLocation',
      //   'hideOptionMenu',
      //   'showOptionMenu',
      //   'closeWindow',
      //   'scanQRCode',
      //   'chooseWXPay'
      // ]
    });
  }
  return wechatObj;
};

const isInWeChat = () =>
  /(micromessenger|webbrowser)/.test(navigator.userAgent.toLocaleLowerCase());

const runWhenWXReady = async () => {
  const wx = await getWX();
  return wx.initialize();
};

const getShareItemUrl = (itemId: string) => {
  return `${process.env.NEXT_PUBLIC_API_END_POINT || ''}/item/${itemId}`;
};

const WeChatService = {
  getWeChatJsConfig,
  isInWeChat,
  runWhenWXReady,
  getShareItemUrl
};

export default WeChatService;
