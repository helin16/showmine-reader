import { useEffect, useState } from 'react';
import ItemService from '@/serivices/ItemService';
import iResList from '@/types/iResList';
import iItem from '@/types/iItem';
import Spinner from '@/components/Spinner';
import { OP_LT, OP_NOT } from '@/helper/ServiceHelper';
import moment from 'moment';
import { useRouter } from 'next/router';
import Utils from '@/serivices/Utils';

type iItemListUnderCompany = {
  companyId?: string;
};

const ItemListUnderCompany = ({ companyId }: iItemListUnderCompany) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [itemList, setItemList] = useState<iResList<iItem> | null>(null);

  useEffect(() => {
    let isCanceled = false;
    const companyIdStr = `${companyId || ''}`.trim();
    if (companyIdStr === '') {
      return;
    }
    setIsLoading(true);
    ItemService.getAllItemsUnderCompany(companyIdStr, {
      perPage: 5,
      currentPage: pageNo,
      include: 'CoverAsset',
      sort: 'publishedAt:DESC',
      where: JSON.stringify({
        isActive: true,
        publishedAt: { [OP_LT]: moment().toISOString() }
      })
    })
      .then(resp => {
        if (pageNo <= 1) {
          setItemList(resp);
        } else {
          setItemList({
            ...resp,
            data: [...(itemList?.data || []), ...resp.data]
          });
        }
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      isCanceled = true;
    };
  }, [companyId, pageNo]);

  const nextPage = () => {
    setPageNo(pageNo + 1);
  };

  const navTo = (itemId: string) => {
    router.replace(`/item/${itemId}`);
  };

  const getPublishAt = (item: iItem) => {
    const publishedAt = `${item.publishedAt || ''}`.trim();
    if (publishedAt === '') {
      return '';
    }
    return moment(publishedAt).format('YYYY-MM-DD HH:mm');
  };

  const nextPageBtn = () => {
    if (itemList?.pages && itemList?.currentPage >= itemList?.pages) {
      return null;
    }
    if (isLoading && pageNo > 1) {
      return <Spinner />;
    }
    return (
      <div className={'text-center'}>
        <a className={'weui-btn weui-btn_primary'} onClick={() => nextPage()}>
          Load more 更多
        </a>
      </div>
    );
  };

  const getList = () => {
    const items = itemList?.data || [];
    if (items.length <= 0) {
      return null;
    }
    return (
      <>
        {items.map(item => {
          return (
            <div className={'item'} key={item.id}>
              <div
                className={'cover-img'}
                style={{
                  backgroundImage: `url(${ItemService.getCoverImageUrl(item)})`
                }}
                onClick={() => navTo(item.id)}
              />
              <div className={'info'}>
                <div
                  className={'title ellipsis'}
                  onClick={() => navTo(item.id)}
                >
                  {item.title}
                </div>
                <div className={'date '}>{getPublishAt(item)}</div>
                <div className={'excerpt ellipsis'}>
                  {Utils.stripHTMLTags(item.excerpt || '')}
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  if (isLoading && pageNo === 1) {
    return <Spinner />;
  }

  return (
    <div className={'item-list-wrapper'}>
      <div className={'item-list'}>{getList()}</div>
      {nextPageBtn()}
    </div>
  );
};

export default ItemListUnderCompany;
