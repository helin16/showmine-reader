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

const getWX = async (jsConfig?: any) => {
  if (window && !wechatObj) {
    // const localJsSDk = `${LocalStorageService.getJsSdk() || ''}`.trim();
    console.log('jsConfig', jsConfig);
    let result: any = jsConfig;
    if (!result) {
      result = await getWeChatJsConfig(window.location.href || '');
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
    console.log('configObj', configObj);
    wechatObj = new WechatJSSDK(configObj);
  }
  return wechatObj;
};

const isInWeChat = () =>
  /(micromessenger|webbrowser)/.test(navigator.userAgent.toLocaleLowerCase());

const runWhenWXReady = async (jsConfig?: any) => {
  const wx = await getWX(jsConfig);
  if (!wx) {
    console.log('XW is empty');
  }
  console.log('wx', wx);
  return wx.initialize();
};

const getShareItemUrl = (itemId: string) => {
  return `${
    process.env.NEXT_PUBLIC_API_END_POINT || ''
  }/item/redirect?itemId=${itemId}&from=wechat`;
};

const getItemCurrentUrl = (itemId: string) => {
  return `${process.env.NEXT_PUBLIC_READER_BASE_URL || ''}/item/${itemId}`;
};

const WeChatService = {
  getWeChatJsConfig,
  isInWeChat,
  runWhenWXReady,
  getShareItemUrl,
  getItemCurrentUrl
};

export default WeChatService;
