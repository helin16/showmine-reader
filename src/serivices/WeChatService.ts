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

const getWX = async (wxJsSdkObj: any = null) => {
  if (window && !wechatObj) {
    const result =
      wxJsSdkObj === null
        ? await getWeChatJsConfig(window.location.href || '')
        : wxJsSdkObj;
    wechatObj = new WechatJSSDK({
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
    });
  }
  return wechatObj;
};

const isInWeChat = () =>
  /(micromessenger|webbrowser)/.test(navigator.userAgent.toLocaleLowerCase());

const runWhenWXReady = async (wxJsSdKObj: any) => {
  const wx = await getWX(wxJsSdKObj);
  if (!wx) {
    console.error('XW is empty');
    return {};
  }
  // console.log('wx', wx);
  return wx.initialize();
};

const getShareItemUrl = (itemId: string) => {
  return `${
    process.env.NEXT_PUBLIC_READER_BASE_URL || ''
  }/item/redirect?itemId=${itemId}`;
};

const WeChatService = {
  getWeChatJsConfig,
  isInWeChat,
  runWhenWXReady,
  getShareItemUrl
};

export default WeChatService;
