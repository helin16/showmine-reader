type iResList<T> = {
  data: T[];
  total: number;
  perPage: number;
  currentPage: number;
  pages: number;
  from: number;
  to: number;
};

export default iResList;
