import { TestBed } from '@angular/core/testing';
import { PageEvent } from '@angular/material/paginator';
import { PaginationService } from './pagination';

describe('PaginationService', () => {
  let service: PaginationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaginationService]
    });
    service = TestBed.inject(PaginationService);
  });

  describe('Initialization', () => {
    it('should create with default values', () => {
      expect(service).toBeTruthy();
      expect(service.currentPage()).toBe(0);
      expect(service.pageSize()).toBe(25);
      expect(service.totalElements()).toBe(0);
      expect(service.totalPages()).toBe(0);
    });

    it('should initialize computed signals correctly', () => {
      expect(service.hasPreviousPage()).toBe(false);
      expect(service.hasNextPage()).toBe(false);
    });
  });

  describe('updateFromResponse', () => {
    it('should update pagination state from backend response', () => {
      const response = {
        totalElements: 100,
        totalPages: 4,
        number: 0
      };

      service.updateFromResponse(response);

      expect(service.totalElements()).toBe(100);
      expect(service.totalPages()).toBe(4);
      expect(service.currentPage()).toBe(0);
    });

    it('should update computed signals after response update', () => {
      service.updateFromResponse({
        totalElements: 50,
        totalPages: 2,
        number: 1
      });

      expect(service.hasPreviousPage()).toBe(true);
      expect(service.hasNextPage()).toBe(false);
    });

    it('should handle zero elements response', () => {
      service.updateFromResponse({
        totalElements: 0,
        totalPages: 0,
        number: 0
      });

      expect(service.totalElements()).toBe(0);
      expect(service.totalPages()).toBe(0);
      expect(service.hasPreviousPage()).toBe(false);
      expect(service.hasNextPage()).toBe(false);
    });
  });

  describe('goToPage', () => {
    beforeEach(() => {
      service.updateFromResponse({
        totalElements: 100,
        totalPages: 4,
        number: 0
      });
    });

    it('should navigate to valid page', () => {
      service.goToPage(2);
      expect(service.currentPage()).toBe(2);
    });

    it('should not navigate to negative page', () => {
      service.goToPage(-1);
      expect(service.currentPage()).toBe(0);
    });

    it('should not navigate beyond total pages', () => {
      service.goToPage(10);
      expect(service.currentPage()).toBe(0);
    });
  });

  describe('handlePageEvent', () => {
    beforeEach(() => {
      service.updateFromResponse({
        totalElements: 100,
        totalPages: 4,
        number: 0
      });
    });

    it('should handle page change event', () => {
      const event: PageEvent = {
        pageIndex: 2,
        pageSize: 25,
        length: 100,
        previousPageIndex: 0
      };

      service.handlePageEvent(event);

      expect(service.currentPage()).toBe(2);
      expect(service.pageSize()).toBe(25);
    });

    it('should handle page size change event', () => {
      const event: PageEvent = {
        pageIndex: 2,
        pageSize: 50,
        length: 100,
        previousPageIndex: 2
      };

      service.handlePageEvent(event);

      expect(service.pageSize()).toBe(50);
      expect(service.currentPage()).toBe(0);
    });
  });
});
