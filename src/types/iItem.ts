import iBaseType from './iBaseType';
import iAuthor from '@/types/iAuthor';
import iCompany from '@/types/iCompany';
import iAsset from '@/types/iAsset';

type iItem = iBaseType & {
  title: string;
  content?: string | null;
  excerpt?: string | null;
  authorId?: string | null;
  noOfVisits: number;
  Author?: iAuthor;
  companyId: string;
  oldId: string | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
  publishedById?: string | null;
  Company?: iCompany;
  CoverAsset?: iAsset;
  enableGTranslateFlag: boolean;
};

export default iItem;
