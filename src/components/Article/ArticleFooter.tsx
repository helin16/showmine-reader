import iCompany from '@/types/iCompany';
import { defaultLogoUrl } from '@/components/DefaultIcon';
import Utils from '@/serivices/Utils';
import ItemListUnderCompany from '@/components/Item/ItemListUnderCompany';

type iArticleFooter = {
  company?: iCompany;
};

const ArticleFooter = ({ company }: iArticleFooter) => {
  const getLogoUrl = () => {
    const logoUrl = `${company?.LogoAsset?.url || ''}`.trim();
    if (logoUrl === '') {
      return defaultLogoUrl;
    }
    return logoUrl;
  };

  const getWebSite = () => {
    const url = `${company?.websiteUrl || ''}`.trim();
    if (url === '') {
      return null;
    }
    return (
      <a className={'website'} href={url}>
        Web: {url}
      </a>
    );
  };
  const getTel = () => {
    const contactNo = `${company?.contactNumber || ''}`.trim();
    if (contactNo === '') {
      return null;
    }
    return (
      <a className={'contact-number'} href={`tel:${contactNo}`}>
        Tel: {contactNo}
      </a>
    );
  };

  if (!company) {
    return null;
  }

  return (
    <div className={'article-footer-wrapper'}>
      <div className={'company-info'}>
        <div
          className={'logo-wrapper'}
          style={{ backgroundImage: `url(${getLogoUrl()})` }}
        ></div>
        <div className={'info'}>
          <div className={'name'}>{company.name}</div>
          <div className={'contact-row'}>
            {getTel()}
            {getWebSite()}
          </div>
          <div className={'description text-muted'}>
            {Utils.stripHTMLTags(company.description || '')}
          </div>
        </div>
      </div>
      <ItemListUnderCompany companyId={company.id} />
    </div>
  );
};

export default ArticleFooter;
