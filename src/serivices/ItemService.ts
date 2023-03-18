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
    return '/default.png';
  }
  return imgUrl;
};

const ItemService = {
  getItemById,
  getAllItemsUnderCompany,
  getCoverImageUrl
};

export default ItemService;
