export interface AggregatedData {
  project?: string;
  employee?: string;
  date?: string;
  hours: number;
}
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export type PagedAggregatedData = PagedResponse<AggregatedData>;
