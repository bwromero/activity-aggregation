import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, switchMap, debounceTime, of, tap, Observable } from 'rxjs';
import { AggregatedData } from '../models/aggregated-data.model';
import {
  GroupByField,
  ACTIVITY_FIELDS,
  DEFAULT_COLUMNS,
  ActivityField,
  UI_CONFIG
} from '../constants/activity-aggregation';
import { TimeBasedCache } from '../utils/cache';
import { ActivityApiClient } from '../utils/activity-api';
import { StateHelpers } from '../utils/state.';


/**
 * Service that handles state management for activity aggregation
 * Uses Repository Pattern (ActivityApiClient) for data access
 */
@Injectable()
export class ActivityService {
  // ========== DEPENDENCIES ==========
  private readonly apiClient = inject(ActivityApiClient);
  private readonly destroyRef = inject(DestroyRef);

  // ========== CONFIGURATION ==========
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
    StateHelpers.hasData(this._loading(), this._error(), this._data().length)
  );

  readonly showNoData = computed(() =>
    StateHelpers.showNoData(this._loading(), this._error(), this._data().length)
  );

  // ========== INITIALIZATION ==========
  constructor() {
    this.initializeLoadPipeline();
  }

  // ========== PUBLIC API ==========
  
  toggleField(field: GroupByField): void {
    this.updateSelectedFields(field);
    this.triggerDataLoad();
  }

  // ========== PRIVATE METHODS ==========

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
    const message = StateHelpers.extractErrorMessage(err, UI_CONFIG.messages.loadingError);
    this._error.set(message);
    this._loading.set(false);
    this._data.set([]);
  }

  private initializeLoadPipeline(): void {
    this.loadTrigger$.pipe(
      debounceTime(150),
      switchMap(groupBy => this.loadData(groupBy)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => this.setSuccessState(data),
      error: (err) => this.setErrorState(err)
    });

    this.loadTrigger$.next([]);
  }

  private loadData(groupBy: GroupByField[]): Observable<AggregatedData[]> {
    const cacheKey = TimeBasedCache.generateKey(groupBy);
    const cachedData = this.cache.get(cacheKey);

    if (cachedData) {
      this._loading.set(false);
      this._error.set(null);
      return of(cachedData);
    }

    this.setLoadingState();
    return this.apiClient.getAggregated(groupBy).pipe(
      tap(data => this.cache.set(cacheKey, data))
    );
  }
}