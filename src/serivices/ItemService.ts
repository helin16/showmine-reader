import AppService, { iConfigParams } from '@/serivices/AppService';
import iItem from '@/types/iItem';
import iResList from '@/types/iResList';
import Utils from '@/serivices/Utils';

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

const SHARE_DESCRIPTION_LENGTH = 200;

// ponytail: on the server only &nbsp; is decoded, other entities show as written. Decode them all if a card shows one.
const getShareDescription = (item: iItem) => {
  const excerpt = `${item.excerpt || ''}`.trim();
  const text = Utils.stripHTMLTags(
    excerpt === '' ? `${item.content || ''}`.trim() : excerpt
  )
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(text).slice(0, SHARE_DESCRIPTION_LENGTH).join('');
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
  getCoverImageUrl,
  getShareDescription
};

export default ItemService;
