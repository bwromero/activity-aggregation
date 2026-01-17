export interface AggregatedData {
  project?: string;
  employee?: string;
  date?: string;
  hours: number;
}

/**
 * Paginated response from backend (Spring Boot Page interface)
 */
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;        // Current page (0-indexed)
  size: number;          // Page size
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Type alias for paginated aggregated data
 */
export type PagedAggregatedData = PagedResponse<AggregatedData>;
