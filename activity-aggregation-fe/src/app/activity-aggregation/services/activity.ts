import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Subject, switchMap, debounceTime, retry, catchError, of, tap, Observable } from 'rxjs';
import { AggregatedData } from '../models/aggregated-data.model';
import {
  API_CONFIG,
  GroupByField,
  ACTIVITY_FIELDS,
  DEFAULT_COLUMNS,
  ActivityField,
  UI_CONFIG
} from '../constants/activity-aggregation';
import { environment } from '../../../environments/environment';
import { TimeBasedCache } from '../utils/cache';

/**
 * Service that handles API calls and state management for activity aggregation
 */
@Injectable()
export class ActivityService {
  // ========== DEPENDENCIES ==========
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  // ========== CONFIGURATION ==========
  private readonly baseUrl = `${environment.apiBaseUrl}${API_CONFIG.endpoints.activities}`;
  private readonly cache = new TimeBasedCache<AggregatedData[]>(5 * 60 * 1000);
  private readonly loadTrigger$ = new Subject<GroupByField[]>();

  // ========== PRIVATE STATE ==========
  private readonly _data = signal<AggregatedData[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedFields = signal<GroupByField[]>([]);

  // ========== PUBLIC STATE ==========
  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedFields = this._selectedFields.asReadonly();

  // ========== COMPUTED STATE ==========
  readonly displayedColumns = computed(() => 
    this._selectedFields().length === 0
      ? DEFAULT_COLUMNS
      : [...this._selectedFields(), ACTIVITY_FIELDS.HOURS] as ActivityField[]
  );

  readonly isFieldSelected = (field: GroupByField) =>
    computed(() => this._selectedFields().includes(field));

  readonly hasData = computed(() =>
    !this._loading() && !this._error() && this._data().length > 0
  );

  readonly showNoData = computed(() =>
    !this._loading() && !this._error() && this._data().length === 0
  );

  // ========== INITIALIZATION ==========
  constructor() {
    this.initializeLoadPipeline();
  }

  // ========== PUBLIC API ==========
  
  /**
   * Toggle field selection for aggregation
   */
  toggleField(field: GroupByField): void {
    this.updateSelectedFields(field);
    this.triggerDataLoad();
  }

  // ========== PRIVATE METHODS: STATE MANAGEMENT ==========

  private updateSelectedFields(field: GroupByField): void {
    this._selectedFields.update(current =>
      current.includes(field)
        ? current.filter(f => f !== field)
        : [...current, field]
    );
  }

  private triggerDataLoad(): void {
    this.loadTrigger$.next(this._selectedFields());
  }

  private setLoadingState(): void {
    this._loading.set(true);
    this._error.set(null);
  }

  private setSuccessState(data: AggregatedData[]): void {
    this._data.set(data);
    this._loading.set(false);
  }

  private setErrorState(err: HttpErrorResponse): void {
    const message = err.error?.message || err.message || 'Unknown error';
    this._error.set(`${UI_CONFIG.messages.loadingError}: ${message}`);
    this._loading.set(false);
    this._data.set([]);
  }

  // ========== PRIVATE METHODS: CACHE ==========

  private getCacheKey(groupBy: GroupByField[]): string {
    return groupBy.length === 0 ? '__all__' : [...groupBy].sort().join(',');
  }

  private tryGetCachedData(cacheKey: string): Observable<AggregatedData[]> | null {
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData) {
      this._loading.set(false);
      this._error.set(null);
      return of(cachedData);
    }
    
    return null;
  }

  private cacheData(cacheKey: string, data: AggregatedData[]): void {
    this.cache.set(cacheKey, data);
  }

  // ========== PRIVATE METHODS: DATA LOADING ==========

  private initializeLoadPipeline(): void {
    this.loadTrigger$.pipe(
      debounceTime(150),
      switchMap(groupBy => this.loadData(groupBy)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => this.setSuccessState(data),
      error: (err) => this.setErrorState(err)
    });

    // Initial load
    this.loadTrigger$.next([]);
  }

  private loadData(groupBy: GroupByField[]): Observable<AggregatedData[]> {
    const cacheKey = this.getCacheKey(groupBy);
    const cached$ = this.tryGetCachedData(cacheKey);

    if (cached$) {
      return cached$;
    }

    this.setLoadingState();
    return this.fetchFromApi(groupBy).pipe(
      tap(data => this.cacheData(cacheKey, data))
    );
  }

  private fetchFromApi(groupBy: GroupByField[]): Observable<AggregatedData[]> {
    const params = this.buildHttpParams(groupBy);
    const url = `${this.baseUrl}${API_CONFIG.endpoints.aggregate}`;

    return this.http.get<AggregatedData[]>(url, { params }).pipe(
      retry({ count: 2, delay: 1000 }),
      catchError((err) => {
        console.error('API fetch error:', err);
        throw err;
      })
    );
  }

  private buildHttpParams(groupBy: GroupByField[]): HttpParams {
    let params = new HttpParams();
    
    if (groupBy.length > 0) {
      params = params.set(API_CONFIG.queryParams.groupBy, groupBy.join(','));
    }
    
    return params;
  }
}