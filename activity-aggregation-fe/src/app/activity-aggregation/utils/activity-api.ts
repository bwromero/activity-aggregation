import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { AggregatedData } from '../models/aggregated-data.model';
import { API_CONFIG, GroupByField } from '../constants/activity-aggregation';
import { environment } from '../../../environments/environment';

/**
 * API client for activity aggregation endpoints
 * Follows Repository Pattern - abstracts data access
 */
@Injectable({ providedIn: 'root' })
export class ActivityApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}${API_CONFIG.endpoints.activities}`;

  /**
   * Fetch aggregated activities with optional grouping
   */
  getAggregated(groupBy: GroupByField[]): Observable<AggregatedData[]> {
    const url = `${this.baseUrl}${API_CONFIG.endpoints.aggregate}`;
    const params = this.buildParams(groupBy);

    return this.http.get<AggregatedData[]>(url, { params }).pipe(
      retry({ count: 2, delay: 1000 }),
      catchError((err) => {
        console.error('API fetch error:', err);
        throw err;
      })
    );
  }

  private buildParams(groupBy: GroupByField[]): HttpParams {
    let params = new HttpParams();
    
    if (groupBy.length > 0) {
      params = params.set(API_CONFIG.queryParams.groupBy, groupBy.join(','));
    }
    
    return params;
  }
}