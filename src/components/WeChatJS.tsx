import WeChatService from '@/serivices/WeChatService';
import { useEffect, useState } from 'react';

const WeChatJS = () => {
  const [isInWeChat, setIsInWeChat] = useState(false);

  useEffect(() => {
    setIsInWeChat(WeChatService.isInWeChat());
  }, []);

  console.log('isInWeChat', isInWeChat);
  return <div />;
};

export default WeChatJS;
