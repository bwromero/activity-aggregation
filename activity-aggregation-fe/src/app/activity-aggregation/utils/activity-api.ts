import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { PagedAggregatedData } from '../models/aggregated-data.model';
import { API_CONFIG, GroupByField } from '../constants/activity-aggregation';
import { environment } from '../../../environments/environment';

/**
 * API client for activity aggregation endpoints
 * Follows Repository Pattern - abstracts data access
 * Supports server-side pagination
 */
@Injectable({ providedIn: 'root' })
export class ActivityApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}${API_CONFIG.endpoints.activities}`;

  /**
   * Fetch paginated aggregated activities with optional grouping
   * @param groupBy Fields to group by
   * @param page Page number (0-indexed)
   * @param size Page size
   * @param sort Optional sort parameter (e.g., 'hours,desc')
   */
  getAggregatedPaged(
    groupBy: GroupByField[],
    page: number = 0,
    size: number = 25,
    sort?: string
  ): Observable<PagedAggregatedData> {
    const url = `${this.baseUrl}${API_CONFIG.endpoints.aggregate}`;
    const params = this.buildParams(groupBy, page, size, sort);

    return this.http.get<any>(url, { params }).pipe(
      map(res => ({
        content: res.content,
        totalElements: res.page.totalElements,
        totalPages: res.page.totalPages,
        number: res.page.number,
        size: res.page.size,
        first: res.page.number === 0,
        last: res.page.number >= res.page.totalPages - 1,
        empty: res.content.length === 0
      })),
      retry({ count: 2, delay: 1000 }),
      catchError((err) => {
        console.error('API fetch error:', err);
        throw err;
      })
    );
  }

  private buildParams(
    groupBy: GroupByField[],
    page: number,
    size: number,
    sort?: string
  ): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (groupBy.length > 0) {
      params = params.set(API_CONFIG.queryParams.groupBy, groupBy.join(','));
    }

    if (sort) {
      params = params.set('sort', sort);
    }

    return params;
  }
}