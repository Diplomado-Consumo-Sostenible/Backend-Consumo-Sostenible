export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  order?: 'ASC' | 'DESC';
}
