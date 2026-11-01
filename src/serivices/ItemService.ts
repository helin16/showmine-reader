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

// Files uploaded to S3 have no generated cover, and older articles stored a broken address for one.
const BROKEN_POSTER = /\sposter=(["'])[^"']*(?:assets\.jpgshowmine66|assets\.showmine66)[^"']*\1/i;

// iPhones play a video full screen without playsinline, and show nothing until play without a cover.
const prepareVideoHtml = (content: string) =>
  content.replace(/<video\b[\s\S]*?<\/video>/gi, video => {
    const hasBrokenPoster = BROKEN_POSTER.test(video);
    const html = video
      .replace(BROKEN_POSTER, '')
      .replace(/^<video\b/i, '<video playsinline webkit-playsinline preload="metadata"');
    if (!hasBrokenPoster) {
      return html;
    }
    // Asks the browser to show a frame from the start of the video instead.
    return html.replace(
      /(<source\b[^>]*\bsrc=(["']))([^"'#]+)\2/gi,
      '$1$3#t=0.1$2'
    );
  });

const ItemService = {
  prepareVideoHtml,
  getItemById,
  getAllItemsUnderCompany,
  getCoverImageUrl
};

export default ItemService;
