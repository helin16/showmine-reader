import iBaseType from './iBaseType';
import iAuthor from '@/types/iAuthor';

type iItem = iBaseType & {
  title: string;
  content?: string | null;
  excerpt?: string | null;
  authorId?: string | null;
  Author?: iAuthor;
  companyId: string;
  oldId: string | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
  publishedById?: string | null;
}

export default iItem;
