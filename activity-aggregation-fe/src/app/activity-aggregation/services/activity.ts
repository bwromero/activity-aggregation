import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, switchMap, debounceTime, of, tap, Observable, delay } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

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
import { PaginationService } from './pagination';

@Injectable()
export class ActivityService {
  private readonly apiClient = inject(ActivityApiClient);
  private readonly pagination = inject(PaginationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly cache = new TimeBasedCache<PagedAggregatedData>(5 * 60 * 1000);
  private readonly loadTrigger$ = new Subject<{
    groupBy: GroupByField[];
    page: number;
  }>();

  private readonly _data = signal<AggregatedData[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedFields = signal<GroupByField[]>([]);

  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedFields = this._selectedFields.asReadonly();

  readonly currentPage = this.pagination.currentPage;
  readonly pageSize = this.pagination.pageSize;
  readonly totalElements = this.pagination.totalElements;
  readonly totalPages = this.pagination.totalPages;
  readonly hasNextPage = this.pagination.hasNextPage;
  readonly hasPreviousPage = this.pagination.hasPreviousPage;

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

  constructor() {
    this.initializeLoadPipeline();
  }

  toggleField(field: GroupByField): void {
    this.updateSelectedFields(field);
    this.pagination.reset();
    this.triggerDataLoad();
  }

  handlePageEvent(event: PageEvent): void {
    this.pagination.handlePageEvent(event);
    this.triggerDataLoad();
  }

  private updateSelectedFields(field: GroupByField): void {
    this._selectedFields.update(current =>
      current.includes(field)
        ? current.filter(f => f !== field)
        : [...current, field]
    );
  }

  private triggerDataLoad(): void {
    this.loadTrigger$.next({
      groupBy: this._selectedFields(),
      page: this.pagination.currentPage()
    });
  }

  private setLoadingState(): void {
    this._loading.set(true);
    this._error.set(null);
  }

  private setSuccessState(response: PagedAggregatedData): void {
    this._data.set(response.content);
    this.pagination.updateFromResponse(response);
    this._loading.set(false);
  }

  private setErrorState(err: HttpErrorResponse): void {
    const message = StateHelpers.extractErrorMessage(
      err,
      UI_CONFIG.messages.loadingError
    );
    this._error.set(message);
    this._loading.set(false);
    this._data.set([]);
  }

  private initializeLoadPipeline(): void {
    this._loading.set(true);
    this.loadTrigger$
      .pipe(
        debounceTime(150),
        switchMap(({ groupBy, page }) => this.loadData(groupBy, page)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => this.setSuccessState(response),
        error: err => this.setErrorState(err)
      });

    this.triggerDataLoad();
  }

  private loadData(
    groupBy: GroupByField[],
    page: number
  ): Observable<PagedAggregatedData> {
    const cacheKey = this.getCacheKey(groupBy, page);
    const cachedData = this.cache.get(cacheKey);

    this.setLoadingState();
    if (cachedData) {
      this._loading.set(false);
      this._error.set(null);
      return of(cachedData);
    }


    return this.apiClient
      .getAggregatedPaged(groupBy, page, this.pagination.pageSize())
      .pipe(tap(data => this.cache.set(cacheKey, data)));
  }

  private getCacheKey(groupBy: GroupByField[], page: number): string {
    const groupKey = TimeBasedCache.generateKey(groupBy);
    return `${groupKey}_page_${page}_size_${this.pagination.pageSize()}`;
  }
}
