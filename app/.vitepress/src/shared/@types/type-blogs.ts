export interface BlogItemT {
  archives: string;
  articleName: string;
  author: any;
  category: string;
  date: string;
  deleteType: string;
  lang: string;
  path: string;
  summary: string;
  tags: string[];
  textContent: string;
  title: string;
  type: string;
  views: number;
}

export interface ParamsType {
  page: number;
  pageSize: number;
  lang: string;
  category: string;
  archives?: string;
  author?: string;
  tags?: string;
}
