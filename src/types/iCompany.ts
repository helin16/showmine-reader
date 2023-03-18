import iBaseType from '@/types/iBaseType';
import iAsset from '@/types/iAsset';

type iCompanyConfig = {
  onBoard?: {
    has_been_setup?: boolean;
    has_set_article?: boolean;
    has_set_channel?: boolean;
    has_done_wizard?: boolean;
  };
};

type iCompany = iBaseType & {
  name: string;
  companyNumber?: string;
  email?: string | null;
  websiteUrl?: string;
  contactNumber?: string;
  description?: string;
  itemDefaultFooter?: string | null;
  logoAssetId?: string | null;
  LogoAsset?: iAsset;
  config?: iCompanyConfig;
  adminConfig?: any;
  paidTo?: Date;
  isExpired?: boolean;
}

export default iCompany;
