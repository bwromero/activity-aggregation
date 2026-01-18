import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, delay } from 'rxjs';
import { signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { ActivityService } from './activity';
import { PaginationService } from './pagination';
import { ActivityApiClient } from '../utils/activity-api';
import { PagedAggregatedData, AggregatedData } from '../models/aggregated-data.model';
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
    const apiClientSpyObj = jasmine.createSpyObj('ActivityApiClient', [
      'getAggregatedPaged'
    ]);

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
    it('should create', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service = TestBed.inject(ActivityService);
      tick(200); // Wait for debounce + initialization
      
      expect(service).toBeTruthy();
    }));

    it('should initialize with empty data', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service = TestBed.inject(ActivityService);
      
      expect(service.selectedFields()).toEqual([]);
      
      tick(200);
    }));

    it('should load initial data on construction', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service = TestBed.inject(ActivityService);
      tick(200);
      
      expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalled();
      expect(service.data()).toEqual(mockPagedResponse.content);
    }));

    it('should set loading to true initially', () => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse).pipe(delay(100)));
      
      service = TestBed.inject(ActivityService);
      
      expect(service.loading()).toBe(true);
    });
  });

  describe('Signal State Management', () => {
    beforeEach(fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service = TestBed.inject(ActivityService);
      tick(200);
    }));

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
    beforeEach(fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service = TestBed.inject(ActivityService);
      tick(200);
    }));

    describe('displayedColumns', () => {
      it('should return default columns when no fields selected', () => {
        expect(service.displayedColumns()).toContain(ACTIVITY_FIELDS.PROJECT);
        expect(service.displayedColumns()).toContain(ACTIVITY_FIELDS.EMPLOYEE);
        expect(service.displayedColumns()).toContain(ACTIVITY_FIELDS.DATE);
        expect(service.displayedColumns()).toContain(ACTIVITY_FIELDS.HOURS);
      });

      it('should return selected fields plus hours when fields are selected', fakeAsync(() => {
        apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
        
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        tick(200);
        
        const columns = service.displayedColumns();
        expect(columns).toContain(ACTIVITY_FIELDS.PROJECT);
        expect(columns).toContain(ACTIVITY_FIELDS.HOURS);
        expect(columns.length).toBe(2);
      }));

      it('should update when multiple fields are selected', fakeAsync(() => {
        apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
        
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        tick(200);
        
        apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
        service.toggleField(ACTIVITY_FIELDS.EMPLOYEE);
        tick(200);
        
        const columns = service.displayedColumns();
        expect(columns).toContain(ACTIVITY_FIELDS.PROJECT);
        expect(columns).toContain(ACTIVITY_FIELDS.EMPLOYEE);
        expect(columns).toContain(ACTIVITY_FIELDS.HOURS);
        expect(columns.length).toBe(3);
      }));
    });

    describe('isFieldSelected', () => {
      it('should return false for unselected field', () => {
        const isSelected = service.isFieldSelected(ACTIVITY_FIELDS.PROJECT);
        expect(isSelected()).toBe(false);
      });

      it('should return true for selected field', fakeAsync(() => {
        apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
        
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        tick(200);
        
        const isSelected = service.isFieldSelected(ACTIVITY_FIELDS.PROJECT);
        expect(isSelected()).toBe(true);
      }));
    });

    describe('hasData', () => {
      it('should return true when data exists and not loading', () => {
        expect(service.hasData()).toBe(true);
      });

      it('should return false when loading', fakeAsync(() => {
        apiClientSpy.getAggregatedPaged.and.returnValue(
          of(mockPagedResponse).pipe(delay(100))
        );
        
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        
        expect(service.hasData()).toBe(false);
        
        tick(300);
      }));

      it('should return false when data is empty', fakeAsync(() => {
        const emptyResponse: PagedAggregatedData = {
          ...mockPagedResponse,
          content: []
        };
        
        apiClientSpy.getAggregatedPaged.and.returnValue(of(emptyResponse));
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        tick(200);
        
        expect(service.hasData()).toBe(false);
      }));
    });

    describe('showNoData', () => {
      it('should return false when data exists', () => {
        expect(service.showNoData()).toBe(false);
      });

      it('should return true when no data and not loading', fakeAsync(() => {
        const emptyResponse: PagedAggregatedData = {
          ...mockPagedResponse,
          content: []
        };
        
        apiClientSpy.getAggregatedPaged.and.returnValue(of(emptyResponse));
        service.toggleField(ACTIVITY_FIELDS.PROJECT);
        tick(200);
        
        expect(service.showNoData()).toBe(true);
      }));
    });
  });

  describe('toggleField', () => {
    beforeEach(fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service = TestBed.inject(ActivityService);
      tick(200);
      apiClientSpy.getAggregatedPaged.calls.reset();
    }));

    it('should add field when not selected', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(service.selectedFields()).toContain(ACTIVITY_FIELDS.PROJECT);
    }));

    it('should remove field when already selected', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(service.selectedFields()).toContain(ACTIVITY_FIELDS.PROJECT);
      
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(service.selectedFields()).not.toContain(ACTIVITY_FIELDS.PROJECT);
    }));

    it('should reset pagination to first page', fakeAsync(() => {
      paginationService.updateFromResponse({
        totalElements: 100,
        totalPages: 4,
        number: 2
      });
      
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(service.currentPage()).toBe(0);
    }));

    it('should trigger data load', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalled();
    }));

    it('should handle multiple field toggles', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service.toggleField(ACTIVITY_FIELDS.EMPLOYEE);
      tick(200);
      
      expect(service.selectedFields()).toContain(ACTIVITY_FIELDS.PROJECT);
      expect(service.selectedFields()).toContain(ACTIVITY_FIELDS.EMPLOYEE);
      expect(service.selectedFields().length).toBe(2);
    }));
  });

  describe('handlePageEvent', () => {
    beforeEach(fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service = TestBed.inject(ActivityService);
      tick(200);
      
      paginationService.updateFromResponse(mockPagedResponse);
      apiClientSpy.getAggregatedPaged.calls.reset();
    }));

    it('should handle page change', fakeAsync(() => {
      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 25,
        length: 50,
        previousPageIndex: 0
      };
      
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service.handlePageEvent(pageEvent);
      tick(200);
      
      expect(service.currentPage()).toBe(1);
      expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalled();
    }));

    it('should handle page size change', fakeAsync(() => {
      const pageEvent: PageEvent = {
        pageIndex: 0,
        pageSize: 50,
        length: 100,
        previousPageIndex: 0
      };
      
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service.handlePageEvent(pageEvent);
      tick(200);
      
      expect(service.pageSize()).toBe(50);
      expect(service.currentPage()).toBe(0);
    }));
  });

  describe('Data Loading', () => {
    beforeEach(fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service = TestBed.inject(ActivityService);
      tick(200);
      apiClientSpy.getAggregatedPaged.calls.reset();
    }));

    it('should set loading state before API call', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(
        of(mockPagedResponse).pipe(delay(100))
      );
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(160); // After debounce, before response
      
      expect(service.loading()).toBe(true);
      
      tick(100);
    }));

    it('should set success state after API call', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(service.loading()).toBe(false);
      expect(service.data()).toEqual(mockPagedResponse.content);
      expect(service.error()).toBeNull();
    }));

    it('should update pagination metadata on success', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(service.totalElements()).toBe(mockPagedResponse.totalElements);
      expect(service.totalPages()).toBe(mockPagedResponse.totalPages);
    }));

    it('should debounce rapid requests', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      service.toggleField(ACTIVITY_FIELDS.PROJECT); // Toggle off
      service.toggleField(ACTIVITY_FIELDS.PROJECT); // Toggle on
      
      tick(200);
      
      // Should only call API once despite 3 toggles
      expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalledTimes(1);
    }));

    it('should pass correct parameters to API client', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalledWith(
        [ACTIVITY_FIELDS.PROJECT],
        0,
        25
      );
    }));
  });

  describe('Error Handling', () => {
    beforeEach(fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service = TestBed.inject(ActivityService);
      tick(200);
      apiClientSpy.getAggregatedPaged.calls.reset();
    }));

    it('should set error state on API failure', fakeAsync(() => {
      const error = new HttpErrorResponse({
        error: { message: 'Server error' },
        status: 500
      });
      
      apiClientSpy.getAggregatedPaged.and.returnValue(throwError(() => error));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(service.error()).toBeTruthy();
      expect(service.loading()).toBe(false);
      expect(service.data()).toEqual([]);
    }));

    it('should extract error message', fakeAsync(() => {
      const error = new HttpErrorResponse({
        error: { message: 'Database connection failed' },
        status: 500
      });
      
      apiClientSpy.getAggregatedPaged.and.returnValue(throwError(() => error));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(service.error()).toContain('Failed to load data');
    }));

    it('should clear previous data on error', fakeAsync(() => {
      // First successful load
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(service.data().length).toBeGreaterThan(0);
      
      // Then error
      const error = new HttpErrorResponse({ status: 500 });
      apiClientSpy.getAggregatedPaged.and.returnValue(throwError(() => error));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(service.data()).toEqual([]);
    }));
  });

  describe('Caching', () => {
    beforeEach(fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service = TestBed.inject(ActivityService);
      tick(200);
      apiClientSpy.getAggregatedPaged.calls.reset();
    }));

    it('should cache API responses', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      // First call
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalledTimes(1);
      
      // Toggle off and on again (same aggregation)
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service.toggleField(ACTIVITY_FIELDS.PROJECT); // Off
      tick(200);
      
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service.toggleField(ACTIVITY_FIELDS.PROJECT); // On - should use cache
      tick(200);
      
      // Should have made 3 API calls total (no cache, all fields, project)
      // But when toggling back to project, it should use cache
      expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalledTimes(3);
    }));

    it('should generate different cache keys for different aggregations', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service.toggleField(ACTIVITY_FIELDS.PROJECT); // Off
      service.toggleField(ACTIVITY_FIELDS.EMPLOYEE); // Different field
      tick(200);
      
      // Should call API for different aggregation
      expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalledTimes(2);
    }));

    it('should generate different cache keys for different pages', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      tick(200);
      
      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 25,
        length: 50,
        previousPageIndex: 0
      };
      
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service.handlePageEvent(pageEvent);
      tick(200);
      
      // Should call API for different page
      expect(apiClientSpy.getAggregatedPaged).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Pagination Integration', () => {
    beforeEach(fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service = TestBed.inject(ActivityService);
      tick(200);
    }));

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
  });
});
