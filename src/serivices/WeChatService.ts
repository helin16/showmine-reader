import AppService, { iConfigParams } from '@/serivices/AppService';
// @ts-ignore
import WechatJSSDK from 'wechat-jssdk/dist/client.umd';
import LocalStorageService from '@/serivices/LocalStorageService';

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
    const localJsSDk = `${LocalStorageService.getJsSdk()}`.trim();
    let result: any;
    if (localJsSDk === '') {
      result = await getWeChatJsConfig(
        process.env.NEXT_PUBLIC_READER_BASE_URL || window.location.href || ''
      );
      LocalStorageService.setJsSdk(JSON.stringify(result));
    } else {
      try {
        result = JSON.parse(localJsSDk);
      } catch (err) {
        console.error(err);
      }
    }
    const configObj = {
      ...result,
      // debug: true,
      jsApiList: [
        'checkJsApi',
        'updateAppMessageShareData',
        'updateTimelineShareData',
        'hideMenuItems',
        'showMenuItems',
        'hideAllNonBaseMenuItem',
        'showAllNonBaseMenuItem',
        'translateVoice',
        'startRecord',
        'stopRecord',
        'onVoiceRecordEnd',
        'playVoice',
        'onVoicePlayEnd',
        'pauseVoice',
        'stopVoice',
        'uploadVoice',
        'downloadVoice',
        'chooseImage',
        'previewImage',
        'uploadImage',
        'downloadImage',
        'getNetworkType',
        'openLocation',
        'getLocation',
        'hideOptionMenu',
        'showOptionMenu',
        'closeWindow',
        'scanQRCode',
        'chooseWXPay'
      ]
    };
    wechatObj = new WechatJSSDK(configObj);
  }
  return wechatObj;
};

const isInWeChat = () =>
  /(micromessenger|webbrowser)/.test(navigator.userAgent.toLocaleLowerCase());

const runWhenWXReady = async () => {
  const wx = await getWX();
  if (!wx) {
    console.log('XW is empty');
  }
  console.log('wx', wx);
  return wx.initialize();
};

const getShareItemUrl = (itemId: string) => {
  return `${
    process.env.NEXT_PUBLIC_API_END_POINT || ''
  }/item/redirect?itemId=${itemId}`;
};

const WeChatService = {
  getWeChatJsConfig,
  isInWeChat,
  runWhenWXReady,
  getShareItemUrl
};

export default WeChatService;
