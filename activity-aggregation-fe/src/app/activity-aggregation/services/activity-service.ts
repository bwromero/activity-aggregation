import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AggregatedData } from '../model/Activity.model';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/activities'; // Adjust port as needed

  getAggregatedActivities(groupBy: string[]): Observable<AggregatedData[]> {
    let params = new HttpParams();
    if (groupBy.length > 0) {
      params = params.set('groupBy', groupBy.join(','));
    }
    return this.http.get<AggregatedData[]>(`${this.apiUrl}/aggregate`, { params });
  }
}
