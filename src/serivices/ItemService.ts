import AppService, {iConfigParams} from '@/serivices/AppService';
import iItem from '@/types/iItem';

const endPoint = '/item';
const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<iItem> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then(resp => resp.data);
}

const ItemService = {
  getItemById
}

export default ItemService;
