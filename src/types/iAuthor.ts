import iBaseType from '@/types/iBaseType';

type iAuthor = iBaseType & {
  name: string;
  url?: string | null;
  companyId: string;
};

export default iAuthor
