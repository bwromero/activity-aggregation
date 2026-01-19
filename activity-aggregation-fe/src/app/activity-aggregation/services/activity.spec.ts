import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

import { ActivityService } from './activity';
import { PaginationService } from './pagination';
import { ActivityApiClient } from '../utils/activity-api';
import { PagedAggregatedData } from '../models/aggregated-data.model';
import { ACTIVITY_FIELDS } from '../constants/activity-aggregation';

describe('ActivityService', () => {
  let service: ActivityService;
  let paginationService: PaginationService;
  let apiClientSpy: jasmine.SpyObj<ActivityApiClient>;

  const mockPagedResponse: PagedAggregatedData = {
    content: [
      { project: 'Project A', employee: 'Alice', date: '2024-01-01', hours: 8 },
      { project: 'Project B', employee: 'Bob', date: '2024-01-02', hours: 6 }
    ],
    totalElements: 50,
    totalPages: 2,
    number: 0,
    size: 25,
    first: true,
    last: false,
    empty: false
  };

  beforeEach(() => {
    const apiClientSpyObj = jasmine.createSpyObj('ActivityApiClient', ['getAggregatedPaged']);
    apiClientSpyObj.getAggregatedPaged.and.returnValue(of(mockPagedResponse));

    TestBed.configureTestingModule({
      providers: [
        ActivityService,
        PaginationService,
        { provide: ActivityApiClient, useValue: apiClientSpyObj }
      ]
    });

    apiClientSpy = TestBed.inject(ActivityApiClient) as jasmine.SpyObj<ActivityApiClient>;
    paginationService = TestBed.inject(PaginationService);
  });

  describe('Initialization', () => {
    it('should create', (done) => {
      service = TestBed.inject(ActivityService);
      
      setTimeout(() => {
        expect(service).toBeTruthy();
        done();
      }, 200);
    });

    it('should initialize with empty selected fields', () => {
      service = TestBed.inject(ActivityService);
      expect(service.selectedFields()).toEqual([]);
    });

    it('should load initial data on construction', (done) => {
      service = TestBed.inject(ActivityService);
      
      setTimeout(() => {
        expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalled();
        expect(service.data()).toEqual(mockPagedResponse.content);
        done();
      }, 200);
    });

    it('should set loading to true initially', () => {
      service = TestBed.inject(ActivityService);
      expect(service.loading()).toBe(true);
    });

    it('should handle empty response', (done) => {
      const emptyResponse: PagedAggregatedData = {
        ...mockPagedResponse,
        content: [],
        totalElements: 0,
        empty: true
      };
      apiClientSpy.getAggregatedPaged.and.returnValue(of(emptyResponse));
      
      service = TestBed.inject(ActivityService);
      
      setTimeout(() => {
        expect(service.data()).toEqual([]);
        expect(service.showNoData()).toBe(true);
        done();
      }, 200);
    });
  });

  describe('Signal State Management', () => {
    beforeEach((done) => {
      service = TestBed.inject(ActivityService);
      setTimeout(done, 200);
    });

    it('should expose readonly data signal', () => {
      expect(service.data()).toEqual(mockPagedResponse.content);
    });

    it('should expose readonly loading signal', () => {
      expect(service.loading()).toBe(false);
    });

    it('should expose readonly error signal', () => {
      expect(service.error()).toBeNull();
    });

    it('should expose readonly selectedFields signal', () => {
      expect(service.selectedFields()).toEqual([]);
    });
  });

  describe('Computed Signals', () => {
    beforeEach((done) => {
      service = TestBed.inject(ActivityService);
      setTimeout(done, 200);
    });

    describe('displayedColumns', () => {
      it('should return default columns when no fields selected', () => {
        const columns = service.displayedColumns();
        expect(columns).toContain(ACTIVITY_FIELDS.PROJECT);
        expect(columns).toContain(ACTIVITY_FIELDS.EMPLOYEE);
        expect(columns).toContain(ACTIVITY_FIELDS.DATE);
        expect(columns).toContain(ACTIVITY_FIELDS.HOURS);
      });

      it('should return selected fields plus hours when fields are selected', (done) => {
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        
        setTimeout(() => {
          const columns = service.displayedColumns();
          expect(columns).toContain(ACTIVITY_FIELDS.PROJECT);
          expect(columns).toContain(ACTIVITY_FIELDS.HOURS);
          expect(columns.length).toBe(2);
          done();
        }, 200);
      });

      it('should update when multiple fields are selected', (done) => {
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        
        setTimeout(() => {
          service.toggleField(ACTIVITY_FIELDS.EMPLOYEE);
          
          setTimeout(() => {
            const columns = service.displayedColumns();
            expect(columns).toContain(ACTIVITY_FIELDS.PROJECT);
            expect(columns).toContain(ACTIVITY_FIELDS.EMPLOYEE);
            expect(columns).toContain(ACTIVITY_FIELDS.HOURS);
            expect(columns.length).toBe(3);
            done();
          }, 200);
        }, 200);
      });
    });

    describe('isFieldSelected', () => {
      it('should return false for unselected field', () => {
        const isSelected = service.isFieldSelected(ACTIVITY_FIELDS.PROJECT);
        expect(isSelected()).toBe(false);
      });

      it('should return true for selected field', (done) => {
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        
        setTimeout(() => {
          const isSelected = service.isFieldSelected(ACTIVITY_FIELDS.PROJECT);
          expect(isSelected()).toBe(true);
          done();
        }, 200);
      });
    });

    describe('hasData', () => {
      it('should return true when data exists and not loading', () => {
        expect(service.hasData()).toBe(true);
      });

      it('should return false when data is empty', (done) => {
        const emptyResponse: PagedAggregatedData = {
          ...mockPagedResponse,
          content: [],
          empty: true
        };
        
        apiClientSpy.getAggregatedPaged.and.returnValue(of(emptyResponse));
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        
        setTimeout(() => {
          expect(service.hasData()).toBe(false);
          done();
        }, 200);
      });
    });

    describe('showNoData', () => {
      it('should return false when data exists', () => {
        expect(service.showNoData()).toBe(false);
      });

      it('should return true when no data and not loading', (done) => {
        const emptyResponse: PagedAggregatedData = {
          ...mockPagedResponse,
          content: [],
          empty: true
        };
        
        apiClientSpy.getAggregatedPaged.and.returnValue(of(emptyResponse));
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        
        setTimeout(() => {
          expect(service.showNoData()).toBe(true);
          done();
        }, 200);
      });
    });
  });

  describe('toggleField', () => {
    beforeEach((done) => {
      service = TestBed.inject(ActivityService);
      setTimeout(() => {
        apiClientSpy.getAggregatedPaged.calls.reset();
        done();
      }, 200);
    });

    it('should add field when not selected', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(service.selectedFields()).toContain(ACTIVITY_FIELDS.PROJECT);
        done();
      }, 200);
    });

    it('should remove field when already selected', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(service.selectedFields()).toContain(ACTIVITY_FIELDS.PROJECT);
        
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        
        setTimeout(() => {
          expect(service.selectedFields()).not.toContain(ACTIVITY_FIELDS.PROJECT);
          done();
        }, 200);
      }, 200);
    });

    it('should reset pagination to first page', (done) => {
      paginationService.updateFromResponse({
        totalElements: 100,
        totalPages: 4,
        number: 2
      });
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(service.currentPage()).toBe(0);
        done();
      }, 200);
    });

    it('should trigger data load', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalled();
        done();
      }, 200);
    });

    it('should handle multiple field toggles', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        service.toggleField(ACTIVITY_FIELDS.EMPLOYEE);
        
        setTimeout(() => {
          expect(service.selectedFields()).toContain(ACTIVITY_FIELDS.PROJECT);
          expect(service.selectedFields()).toContain(ACTIVITY_FIELDS.EMPLOYEE);
          expect(service.selectedFields().length).toBe(2);
          done();
        }, 200);
      }, 200);
    });

    it('should handle toggle on/off same field', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(service.selectedFields()).not.toContain(ACTIVITY_FIELDS.PROJECT);
        done();
      }, 200);
    });
  });

  describe('handlePageEvent', () => {
    beforeEach((done) => {
      service = TestBed.inject(ActivityService);
      setTimeout(() => {
        paginationService.updateFromResponse(mockPagedResponse);
        apiClientSpy.getAggregatedPaged.calls.reset();
        done();
      }, 200);
    });

    it('should handle page change', (done) => {
      paginationService.updateFromResponse({
        totalElements: 50,
        totalPages: 2,
        number: 0
      });
      
      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 25,
        length: 50,
        previousPageIndex: 0
      };
      
      const page1Response: PagedAggregatedData = {
        ...mockPagedResponse,
        number: 1,
        totalElements: 50,
        totalPages: 2
      };
      apiClientSpy.getAggregatedPaged.and.returnValue(of(page1Response));
      
      service.handlePageEvent(pageEvent);
      
      setTimeout(() => {
        expect(service.currentPage()).toBe(1);
        expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalled();
        done();
      }, 200);
    });

    it('should handle page size change', (done) => {
      const pageEvent: PageEvent = {
        pageIndex: 0,
        pageSize: 50,
        length: 100,
        previousPageIndex: 0
      };
      
      service.handlePageEvent(pageEvent);
      
      setTimeout(() => {
        expect(service.pageSize()).toBe(50);
        expect(service.currentPage()).toBe(0);
        done();
      }, 200);
    });

    it('should handle page change to last page', (done) => {
      paginationService.updateFromResponse({
        totalElements: 50,
        totalPages: 2,
        number: 0
      });
      
      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 25,
        length: 50,
        previousPageIndex: 0
      };
      
      const lastPageResponse: PagedAggregatedData = {
        ...mockPagedResponse,
        number: 1,
        totalElements: 50,
        totalPages: 2,
        last: true
      };
      apiClientSpy.getAggregatedPaged.and.returnValue(of(lastPageResponse));
      
      service.handlePageEvent(pageEvent);
      
      setTimeout(() => {
        expect(service.currentPage()).toBe(1);
        done();
      }, 200);
    });
  });

  describe('Data Loading', () => {
    beforeEach((done) => {
      service = TestBed.inject(ActivityService);
      setTimeout(() => {
        apiClientSpy.getAggregatedPaged.calls.reset();
        done();
      }, 200);
    });

    it('should set success state after API call', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(service.loading()).toBe(false);
        expect(service.data()).toEqual(mockPagedResponse.content);
        expect(service.error()).toBeNull();
        done();
      }, 200);
    });

    it('should update pagination metadata on success', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(service.totalElements()).toBe(mockPagedResponse.totalElements);
        expect(service.totalPages()).toBe(mockPagedResponse.totalPages);
        done();
      }, 200);
    });

    it('should pass correct parameters to API client', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalledWith(
          [ACTIVITY_FIELDS.PROJECT],
          0,
          25
        );
        done();
      }, 200);
    });

    it('should handle large dataset', (done) => {
      const largeResponse: PagedAggregatedData = {
        ...mockPagedResponse,
        totalElements: 10000,
        totalPages: 400
      };
      apiClientSpy.getAggregatedPaged.and.returnValue(of(largeResponse));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(service.totalElements()).toBe(10000);
        done();
      }, 200);
    });
  });

  describe('Debouncing', () => {
    beforeEach((done) => {
      service = TestBed.inject(ActivityService);
      setTimeout(() => {
        apiClientSpy.getAggregatedPaged.calls.reset();
        done();
      }, 200);
    });

    it('should debounce rapid requests', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalledTimes(1);
        done();
      }, 200);
    });

    it('should make separate calls after debounce period', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        const firstCallCount = apiClientSpy.getAggregatedPaged.calls.count();
        
        service.toggleField(ACTIVITY_FIELDS.EMPLOYEE);
        
        setTimeout(() => {
          expect(apiClientSpy.getAggregatedPaged.calls.count()).toBe(firstCallCount + 1);
          done();
        }, 200);
      }, 200);
    });
  });

  describe('Error Handling', () => {
    beforeEach((done) => {
      service = TestBed.inject(ActivityService);
      setTimeout(() => {
        apiClientSpy.getAggregatedPaged.calls.reset();
        done();
      }, 200);
    });

    it('should set error state on API failure', (done) => {
      const error = new HttpErrorResponse({
        error: { message: 'Server error' },
        status: 500
      });
      
      apiClientSpy.getAggregatedPaged.and.returnValue(throwError(() => error));
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(service.error()).toBeTruthy();
        expect(service.loading()).toBe(false);
        expect(service.data()).toEqual([]);
        done();
      }, 200);
    });

    it('should extract error message', (done) => {
      const error = new HttpErrorResponse({
        error: { message: 'Database connection failed' },
        status: 500
      });
      
      apiClientSpy.getAggregatedPaged.and.returnValue(throwError(() => error));
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(service.error()).toContain('Failed to load data');
        done();
      }, 200);
    });

    it('should clear previous data on error', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(service.data().length).toBe(2);
        
        const error = new HttpErrorResponse({ status: 500 });
        apiClientSpy.getAggregatedPaged.and.returnValue(throwError(() => error));
        
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        service.toggleField(ACTIVITY_FIELDS.EMPLOYEE);
        
        setTimeout(() => {
          expect(service.data()).toEqual([]);
          done();
        }, 200);
      }, 200);
    });

    it('should handle network error', (done) => {
      const error = new HttpErrorResponse({ status: 0 });
      apiClientSpy.getAggregatedPaged.and.returnValue(throwError(() => error));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        expect(service.error()).toBeTruthy();
        expect(service.loading()).toBe(false);
        done();
      }, 200);
    });
  });

  describe('Caching', () => {
    beforeEach((done) => {
      service = TestBed.inject(ActivityService);
      setTimeout(() => {
        apiClientSpy.getAggregatedPaged.calls.reset();
        done();
      }, 200);
    });

    it('should cache API responses', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        const firstCallCount = apiClientSpy.getAggregatedPaged.calls.count();
        expect(firstCallCount).toBe(1);
        
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        
        setTimeout(() => {
          expect(apiClientSpy.getAggregatedPaged.calls.count()).toBe(firstCallCount);
          done();
        }, 200);
      }, 200);
    });

    it('should generate different cache keys for different aggregations', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        service.toggleField(ACTIVITY_FIELDS.EMPLOYEE);
        
        setTimeout(() => {
          expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalledTimes(2);
          done();
        }, 200);
      }, 200);
    });

    it('should generate different cache keys for different pages', (done) => {
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      
      setTimeout(() => {
        const pageEvent: PageEvent = {
          pageIndex: 1,
          pageSize: 25,
          length: 50,
          previousPageIndex: 0
        };
        
        service.handlePageEvent(pageEvent);
        
        setTimeout(() => {
          expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalledTimes(2);
          done();
        }, 200);
      }, 200);
    });
  });

  describe('Pagination Integration', () => {
    beforeEach((done) => {
      service = TestBed.inject(ActivityService);
      setTimeout(done, 200);
    });

    it('should expose pagination signals', () => {
      expect(service.currentPage).toBeDefined();
      expect(service.pageSize).toBeDefined();
      expect(service.totalElements).toBeDefined();
      expect(service.totalPages).toBeDefined();
      expect(service.hasNextPage).toBeDefined();
      expect(service.hasPreviousPage).toBeDefined();
    });

    it('should have correct initial pagination values', () => {
      expect(service.currentPage()).toBe(mockPagedResponse.number);
      expect(service.pageSize()).toBe(25);
      expect(service.totalElements()).toBe(mockPagedResponse.totalElements);
    });

    it('should update pagination on response', () => {
      expect(service.totalPages()).toBe(mockPagedResponse.totalPages);
      expect(service.hasNextPage()).toBe(true);
      expect(service.hasPreviousPage()).toBe(false);
    });
  });
});
