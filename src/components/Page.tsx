import GTranslator from '@/components/GTranslator';

type iPage = {
  header?: any;
  children: any;
  className?: string;
};
const Page = ({ header, children, className }: iPage) => {
  return (
    <div className={`page-wrapper ${className}`}>
      {header || null}
      <main>{children}</main>
    </div>
  );
};

export default Page;
