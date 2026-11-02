import moment, { MomentInput } from 'moment';
import { useEffect, useState } from 'react';

const FORMAT = 'YYYY-MM-DD HH:mm';

// The server's timezone isn't the reader's, so the first render has to match on both, and the local time follows.
const ArticleDate = ({ value }: { value: MomentInput }) => {
  const [text, setText] = useState(() => moment.utc(value).format(FORMAT));

  useEffect(() => {
    setText(moment(value).format(FORMAT));
  }, [value]);

  return <>{text}</>;
};

export default ArticleDate;
