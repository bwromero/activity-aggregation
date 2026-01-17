import { Injectable, signal, computed } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

@Injectable()
export class PaginationService {
  // ========== STATE ==========
  private readonly _currentPage = signal(0);
  private readonly _pageSize = signal(25);
  private readonly _totalElements = signal(0);
  private readonly _totalPages = signal(0);

  // ========== READONLY STATE ==========
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();

  // ========== COMPUTED ==========
  readonly hasPreviousPage = computed(() => this._currentPage() > 0);
  readonly hasNextPage = computed(
    () => this._currentPage() < this._totalPages() - 1
  );

  // ========== COMMANDS ==========
  goToPage(page: number): void {
    if (page >= 0 && page < this._totalPages()) {
      this._currentPage.set(page);
    }
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this._currentPage.update(p => p + 1);
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this._currentPage.update(p => p - 1);
    }
  }

  changePageSize(size: number): void {
    this._pageSize.set(size);
    this.reset();
  }

  reset(): void {
    this._currentPage.set(0);
  }

  handlePageEvent(event: PageEvent): void {
    if (event.pageSize !== this._pageSize()) {
      this.changePageSize(event.pageSize);
    } else {
      this.goToPage(event.pageIndex);
    }
  }

  // ========== SYNC FROM API ==========
  updateFromResponse(response: {
    totalElements: number;
    totalPages: number;
    number: number;
  }): void {
    this._totalElements.set(response.totalElements);
    this._totalPages.set(response.totalPages);
    this._currentPage.set(response.number);
  }
}
