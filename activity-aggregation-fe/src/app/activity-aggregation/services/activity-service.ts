import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Subject, switchMap, debounceTime, retry, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AggregatedData } from '../model/Activity.model';
import {
  API_CONFIG,
  BACKEND_FIELD_MAPPING,
  GroupByField,
  ACTIVITY_FIELDS,
  DEFAULT_COLUMNS,
  ActivityField,
  UI_CONFIG
} from '../constants/activity-aggregation.constants';
import { environment } from '../../../environments/environment';

/**
 * Service that handles API calls and state management for activity aggregation
 * @description Provides reactive state and methods for filtering and displaying aggregated activity data
 */
@Injectable() // Component-scoped for isolated state
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly baseUrl = `${environment.apiBaseUrl}${API_CONFIG.endpoints.activities}`;

  // Private state signals
  private readonly _data = signal<AggregatedData[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedFields = signal<GroupByField[]>([]);

  // Request trigger for controlled loading
  private readonly loadTrigger$ = new Subject<GroupByField[]>();

  // Public readonly state
  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedFields = this._selectedFields.asReadonly();

  // Computed state
  readonly displayedColumns = computed(() => {
    const selected = this._selectedFields();
    return selected.length === 0
      ? DEFAULT_COLUMNS
      : [...selected, ACTIVITY_FIELDS.HOURS] as ActivityField[];
  });

  readonly isFieldSelected = (field: GroupByField) =>
    computed(() => this._selectedFields().includes(field));

  readonly hasData = computed(() =>
    !this._loading() && !this._error() && this._data().length > 0
  );

  readonly showNoData = computed(() =>
    !this._loading() && !this._error() && this._data().length === 0
  );

  constructor() {
    this.setupLoadPipeline();
    this.loadTrigger$.next([]);  // Initial load
  }

  /**
   * Toggle field selection for aggregation
   */
  toggleField(field: GroupByField): void {
    this._selectedFields.update(current =>
      current.includes(field)
        ? current.filter(f => f !== field)
        : [...current, field]
    );
    this.loadTrigger$.next(this._selectedFields());
  }

  /**
   * Manually refresh data
   */
  refresh(): void {
    this.loadTrigger$.next(this._selectedFields());
  }

  /**
   * Setup reactive data loading pipeline with debounce and cancellation
   */
  private setupLoadPipeline(): void {
    this.loadTrigger$.pipe(
      debounceTime(300),  // Debounce rapid toggles
      switchMap(groupBy => {
        this._loading.set(true);
        this._error.set(null);
        return this.fetchAggregatedData(groupBy);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this._data.set(data);
        this._loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const message = err.error?.message || err.message || 'Unknown error';
        this._error.set(`${UI_CONFIG.messages.loadingError}: ${message}`);
        this._loading.set(false);
        this._data.set([]);
      }
    });
  }

  /**
   * Fetch aggregated data from API
   */
  private fetchAggregatedData(groupBy: GroupByField[]) {
    const url = `${this.baseUrl}${API_CONFIG.endpoints.aggregate}`;
    let params = new HttpParams();

    if (groupBy.length > 0) {
      params = params.set(API_CONFIG.queryParams.groupBy, groupBy.join(','));
    }


    return this.http.get<AggregatedData[]>(url, { params }).pipe(
      retry({ count: 2, delay: 1000 }),
      catchError((err) => {
        console.error('API fetch error:', err);
        throw err;
      })
    );

  }

}