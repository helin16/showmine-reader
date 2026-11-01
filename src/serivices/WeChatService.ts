import AppService, { iConfigParams } from '@/serivices/AppService';
import LocalStorageService from '@/serivices/LocalStorageService';

const endPoint = '/weChat';
const WX_SCRIPT_URL = 'https://res.wx.qq.com/open/js/jweixin-1.4.0.js';
let wxConfig: any = null;

const getWeChatJsConfig = (
  url: string,
  params?: iConfigParams,
  config?: iConfigParams
) =>
  AppService.post(`${endPoint}/js/conf`, { url, ...params }, config).then(
    resp => resp.data
  );

const getWXConfig = async (jsConfig?: any) => {
  if (window && !wxConfig) {
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
        'chooseWXPay',
        'onMenuShareTimeline',
        'onMenuShareAppMessage'
      ]
    };
    console.log('configObj', configObj);
    wxConfig = configObj;
  }
  return wxConfig;
};

// Loading the file again does nothing, so only a failed load is tried again.
const loadWXScript = () =>
  new Promise<void>((resolve, reject) => {
    if ((window as any).wx) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    script.src = WX_SCRIPT_URL;
    document.head.appendChild(script);
  });

const configureWX = (config: any) =>
  new Promise<any>((resolve, reject) => {
    const { wx } = window as any;
    if (!wx) {
      reject(new Error('wx js not defined'));
      return;
    }
    wx.config(config);
    wx.ready(() => resolve({ wx }));
    wx.error(reject);
  });

const isInWeChat = () =>
  /(micromessenger|webbrowser)/.test(navigator.userAgent.toLocaleLowerCase());

const runWhenWXReady = async (jsConfig?: any) => {
  const config = await getWXConfig(jsConfig);
  if (!config) {
    console.log('XW is empty');
  }
  await loadWXScript();
  return configureWX(config);
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
