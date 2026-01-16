import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AggregatedData } from '../model/Activity.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_ENDPOINTS } from '../constants/activity-aggregation.constants'
@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private http = inject(HttpClient);
  private apiUrl = API_ENDPOINTS.activities;  

  getAggregatedActivities(groupBy: string[]): Observable<AggregatedData[]> {
    let params = new HttpParams();
    if (groupBy.length > 0) {
      params = params.set('groupBy', groupBy.join(','));
    }
    return this.http.get<any[]>(`${this.apiUrl}/aggregate`, { params }).pipe(
      map(data => data.map(item => ({
        project: item.Project,
        employee: item.Employee,
        date: item.Date,
        hours: item.Hours
      })))
    );
  }
}
