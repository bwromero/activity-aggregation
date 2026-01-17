import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, switchMap, debounceTime, of, tap, Observable } from 'rxjs';
import { AggregatedData, PagedAggregatedData } from '../models/aggregated-data.model';
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
 * Supports server-side pagination for large datasets
 */
@Injectable()
export class ActivityService {
  // ========== DEPENDENCIES ==========
  private readonly apiClient = inject(ActivityApiClient);
  private readonly destroyRef = inject(DestroyRef);

  // ========== CONFIGURATION ==========
  private readonly cache = new TimeBasedCache<PagedAggregatedData>(5 * 60 * 1000);
  private readonly loadTrigger$ = new Subject<{
    groupBy: GroupByField[];
    page: number;
  }>();

  // ========== PRIVATE STATE ==========
  private readonly _data = signal<AggregatedData[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedFields = signal<GroupByField[]>([]);
  
  // Pagination state
  private readonly _currentPage = signal(0);
  private readonly _pageSize = signal(25);
  private readonly _totalElements = signal(0);
  private readonly _totalPages = signal(0);

  // ========== PUBLIC STATE ==========
  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedFields = this._selectedFields.asReadonly();
  
  // Pagination public state
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();

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

  // Pagination computed
  readonly hasPreviousPage = computed(() => this._currentPage() > 0);
  readonly hasNextPage = computed(() => this._currentPage() < this._totalPages() - 1);

  // ========== INITIALIZATION ==========
  constructor() {
    this.initializeLoadPipeline();
  }

  // ========== PUBLIC API ==========
  
  /**
   * Toggle field selection for aggregation (resets to first page)
   */
  toggleField(field: GroupByField): void {
    this.updateSelectedFields(field);
    this.resetToFirstPage();
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this._totalPages()) {
      this._currentPage.set(page);
      this.triggerDataLoad();
    }
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this.goToPage(this._currentPage() + 1);
    }
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.goToPage(this._currentPage() - 1);
    }
  }

  /**
   * Change page size (resets to first page)
   */
  changePageSize(size: number): void {
    this._pageSize.set(size);
    this.resetToFirstPage();
  }

  // ========== PRIVATE METHODS ==========

  private updateSelectedFields(field: GroupByField): void {
    this._selectedFields.update(current =>
      current.includes(field)
        ? current.filter(f => f !== field)
        : [...current, field]
    );
  }

  private resetToFirstPage(): void {
    this._currentPage.set(0);
    this.triggerDataLoad();
  }

  private triggerDataLoad(): void {
    this.loadTrigger$.next({
      groupBy: this._selectedFields(),
      page: this._currentPage()
    });
  }

  private setLoadingState(): void {
    this._loading.set(true);
    this._error.set(null);
  }

  private setSuccessState(response: PagedAggregatedData): void {
    this._data.set(response.content);
    this._totalElements.set(response.totalElements);
    this._totalPages.set(response.totalPages);
    this._currentPage.set(response.number);
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
      switchMap(({ groupBy, page }) => this.loadData(groupBy, page)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => this.setSuccessState(response),
      error: (err) => this.setErrorState(err)
    });

    // Initial load
    this.triggerDataLoad();
  }

  private loadData(
    groupBy: GroupByField[],
    page: number
  ): Observable<PagedAggregatedData> {
    const cacheKey = this.getCacheKey(groupBy, page);
    const cachedData = this.cache.get(cacheKey);

    if (cachedData) {
      this._loading.set(false);
      this._error.set(null);
      return of(cachedData);
    }

    this.setLoadingState();
    return this.apiClient
      .getAggregatedPaged(groupBy, page, this._pageSize())
      .pipe(tap(data => this.cache.set(cacheKey, data)));
  }

  private getCacheKey(groupBy: GroupByField[], page: number): string {
    const groupKey = TimeBasedCache.generateKey(groupBy);
    return `${groupKey}_page_${page}_size_${this._pageSize()}`;
  }
}
