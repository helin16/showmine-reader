import AppService, { iConfigParams } from '@/serivices/AppService';
import iItem from '@/types/iItem';
import iResList from '@/types/iResList';

const endPoint = '/item';
const getItemById = async (
  id: string,
  params?: iConfigParams,
  config?: iConfigParams
): Promise<iItem> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then(
    resp => resp.data
  );
};

const getAllItemsUnderCompany = async (
  companyId: string,
  params?: iConfigParams,
  config?: iConfigParams
): Promise<iResList<iItem>> => {
  return AppService.get(`${endPoint}`, params, {
    headers: {
      [AppService.getHeaderCompanyIdName()]: companyId
    }
  }).then(resp => resp.data);
};

const getCoverImageUrl = (item: iItem) => {
  const imgUrl = `${item.CoverAsset?.url || ''}`.trim();
  if (imgUrl === '') {
    return `${process.env.NEXT_PUBLIC_READER_BASE_URL || ''}/default.png`;
  }
  return imgUrl.replace('/image/upload/', '/image/upload/w_300/');
};

// Older articles stored a cover address with a host that does not exist.
const BROKEN_POSTER = /\sposter=(["'])[^"']*assets\.jpgshowmine66[^"']*\1/i;

const AUTOPLAY = /\sautoplay\b(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?/gi;

// iPhones play a video full screen without playsinline, and nothing downloads before a tap with preload none.
const prepareVideoHtml = (content: string) =>
  content.replace(/<video\b[\s\S]*?<\/video>/gi, video =>
    video
      .replace(BROKEN_POSTER, '')
      .replace(AUTOPLAY, '')
      .replace(
        /^<video\b/i,
        '<video playsinline webkit-playsinline preload="none"'
      )
  );

const ItemService = {
  prepareVideoHtml,
  getItemById,
  getAllItemsUnderCompany,
  getCoverImageUrl
};

export default ItemService;
