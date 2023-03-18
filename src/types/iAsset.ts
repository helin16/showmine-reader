import iBaseType from '@/types/iBaseType';

type iAsset = iBaseType & {
  type: string;
  externalAssetId?: string | null;
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  comments?: string;
  url?: string;
  companyId: string;
}

export default iAsset;
