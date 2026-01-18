import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { ActivityAggregationComponent } from './activity-aggregation';
import { ActivityService } from './services/activity';
import { PaginationService } from './services/pagination';
import { ActivityFilterComponent } from './components/activity-filter/activity-filter';
import { ActivityTableComponent } from './components/activity-table/activity-table';
import { ACTIVITY_FIELDS } from './constants/activity-aggregation';
import { ActivityApiClient } from './utils/activity-api';
import { PagedAggregatedData } from './models/aggregated-data.model';

describe('ActivityAggregationComponent', () => {
  let component: ActivityAggregationComponent;
  let fixture: ComponentFixture<ActivityAggregationComponent>;
  let service: ActivityService;
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

  beforeEach(async () => {
    const apiClientSpyObj = jasmine.createSpyObj('ActivityApiClient', [
      'getAggregatedPaged'
    ]);
    apiClientSpyObj.getAggregatedPaged.and.returnValue(of(mockPagedResponse));

    await TestBed.configureTestingModule({
      imports: [
        ActivityAggregationComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivityApiClient, useValue: apiClientSpyObj }
      ]
    }).compileComponents();

    apiClientSpy = TestBed.inject(ActivityApiClient) as jasmine.SpyObj<ActivityApiClient>;
  });

  describe('Component Creation', () => {
    it('should create', fakeAsync(() => {
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);
      
      expect(component).toBeTruthy();
    }));

    it('should inject ActivityService', fakeAsync(() => {
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);
      
      expect(component['service']).toBeDefined();
      expect(component['service']).toBeInstanceOf(ActivityService);
    }));

    it('should provide services at component level', fakeAsync(() => {
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);
      
      service = fixture.debugElement.injector.get(ActivityService);
      expect(service).toBeDefined();
    }));

    it('should have constants defined', fakeAsync(() => {
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);
      
      expect(component['ACTIVITY_FIELDS']).toBeDefined();
      expect(component['UI_CONFIG']).toBeDefined();
      expect(component['Math']).toBe(Math);
    }));
  });

  describe('Template Structure', () => {
    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);
    }));

    it('should render mat-card', () => {
      const card = fixture.debugElement.query(By.css('mat-card'));
      expect(card).toBeTruthy();
    });

    it('should render mat-card-header', () => {
      const header = fixture.debugElement.query(By.css('mat-card-header'));
      expect(header).toBeTruthy();
    });

    it('should render mat-card-content', () => {
      const content = fixture.debugElement.query(By.css('mat-card-content'));
      expect(content).toBeTruthy();
    });

    it('should render activity-filter component', () => {
      const filter = fixture.debugElement.query(By.directive(ActivityFilterComponent));
      expect(filter).toBeTruthy();
    });

    it('should render activity-table when data exists', () => {
      const table = fixture.debugElement.query(By.directive(ActivityTableComponent));
      expect(table).toBeTruthy();
    });

    it('should render mat-paginator when data exists', () => {
      const paginator = fixture.debugElement.query(By.css('mat-paginator'));
      expect(paginator).toBeTruthy();
    });

    it('should display correct header subtitle', () => {
      const subtitle = fixture.debugElement.query(By.css('mat-card-subtitle'));
      expect(subtitle.nativeElement.textContent.trim()).toContain('Group fields by:');
    });
  });

  describe('Filter Component Integration', () => {
    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);
      apiClientSpy.getAggregatedPaged.calls.reset();
    }));

    it('should pass correct inputs to filter component', () => {
      const filterComponent = fixture.debugElement.query(
        By.directive(ActivityFilterComponent)
      ).componentInstance;

      expect(filterComponent.isProjectSelected()).toBe(false);
      expect(filterComponent.isEmployeeSelected()).toBe(false);
      expect(filterComponent.isDateSelected()).toBe(false);
    });

    it('should update filter inputs when field is toggled', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      service = fixture.debugElement.injector.get(ActivityService);
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      fixture.detectChanges();
      tick(200);

      const filterComponent = fixture.debugElement.query(
        By.directive(ActivityFilterComponent)
      ).componentInstance;

      expect(filterComponent.isProjectSelected()).toBe(true);
    }));

    it('should handle fieldToggled event from filter', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      service = fixture.debugElement.injector.get(ActivityService);
      spyOn(service, 'toggleField');

      const filterDebugElement = fixture.debugElement.query(
        By.directive(ActivityFilterComponent)
      );
      const filterComponent = filterDebugElement.componentInstance;

      filterComponent.fieldToggled.emit(ACTIVITY_FIELDS.PROJECT);
      fixture.detectChanges();

      expect(service.toggleField).toHaveBeenCalledWith(ACTIVITY_FIELDS.PROJECT);
    }));
  });

  describe('Table Component Integration', () => {
    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);
    }));

    it('should pass correct data to table component', () => {
      const tableComponent = fixture.debugElement.query(
        By.directive(ActivityTableComponent)
      ).componentInstance;

      expect(tableComponent.data()).toEqual(mockPagedResponse.content);
    });

    it('should pass correct displayed columns to table component', () => {
      const tableComponent = fixture.debugElement.query(
        By.directive(ActivityTableComponent)
      ).componentInstance;

      const columns = tableComponent.displayedColumns();
      expect(columns).toContain(ACTIVITY_FIELDS.PROJECT);
      expect(columns).toContain(ACTIVITY_FIELDS.EMPLOYEE);
      expect(columns).toContain(ACTIVITY_FIELDS.DATE);
      expect(columns).toContain(ACTIVITY_FIELDS.HOURS);
    });

    it('should update table data when service data changes', fakeAsync(() => {
      const newResponse: PagedAggregatedData = {
        ...mockPagedResponse,
        content: [
          { project: 'Project C', employee: 'Charlie', date: '2024-01-03', hours: 7 }
        ]
      };

      apiClientSpy.getAggregatedPaged.and.returnValue(of(newResponse));
      service = fixture.debugElement.injector.get(ActivityService);
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      fixture.detectChanges();
      tick(200);

      const tableComponent = fixture.debugElement.query(
        By.directive(ActivityTableComponent)
      ).componentInstance;

      expect(tableComponent.data()).toEqual(newResponse.content);
    }));
  });

  describe('Paginator Integration', () => {
    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);
      apiClientSpy.getAggregatedPaged.calls.reset();
    }));

    it('should configure paginator with correct properties', () => {
      const paginator = fixture.debugElement.query(By.css('mat-paginator'));
      const paginatorInstance = paginator.componentInstance;

      expect(paginatorInstance.length).toBe(mockPagedResponse.totalElements);
      expect(paginatorInstance.pageSize).toBe(25);
      expect(paginatorInstance.pageIndex).toBe(0);
    });

    it('should call onPageChange when paginator emits event', fakeAsync(() => {
      spyOn(component, 'onPageChange');

      const paginator = fixture.debugElement.query(By.css('mat-paginator'));
      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 25,
        length: 50,
        previousPageIndex: 0
      };

      paginator.componentInstance.page.emit(pageEvent);
      fixture.detectChanges();

      expect(component.onPageChange).toHaveBeenCalledWith(pageEvent);
    }));

    it('should delegate to service handlePageEvent', fakeAsync(() => {
      service = fixture.debugElement.injector.get(ActivityService);
      spyOn(service, 'handlePageEvent');

      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 25,
        length: 50,
        previousPageIndex: 0
      };

      component.onPageChange(pageEvent);

      expect(service.handlePageEvent).toHaveBeenCalledWith(pageEvent);
    }));

    it('should display pagination info correctly', () => {
      const paginationInfo = fixture.debugElement.query(By.css('.pagination-info'));
      
      if (paginationInfo) {
        const text = paginationInfo.nativeElement.textContent;
        expect(text).toContain('Showing');
        expect(text).toContain('1');
        expect(text).toContain(mockPagedResponse.totalElements.toString());
      }
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      expect(spinner).toBeTruthy();
      
      tick(200);
    }));

    it('should hide loading spinner after data loads', fakeAsync(() => {
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);

      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      expect(spinner).toBeFalsy();
    }));

    it('should show loading message', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const loadingElement = fixture.debugElement.query(By.css('.loading-state'));
      if (loadingElement) {
        expect(loadingElement.nativeElement.textContent).toContain('Loading');
      }
      
      tick(200);
    }));
  });

  describe('Error State', () => {
    it('should display error message when error occurs', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(
        of(mockPagedResponse)
      );
      
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);

      // Manually set error state for testing
      service = fixture.debugElement.injector.get(ActivityService);
      (service as any)._error.set('Test error message');
      (service as any)._loading.set(false);
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.error'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain('Test error message');
    }));

    it('should hide other content when error occurs', fakeAsync(() => {
      apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));
      
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);

      // Set error state
      service = fixture.debugElement.injector.get(ActivityService);
      (service as any)._error.set('Error');
      (service as any)._loading.set(false);
      (service as any)._data.set([]);
      fixture.detectChanges();

      const table = fixture.debugElement.query(By.directive(ActivityTableComponent));
      expect(table).toBeFalsy();
    }));
  });

  describe('Empty State', () => {
    it('should display no data message when data is empty', fakeAsync(() => {
      const emptyResponse: PagedAggregatedData = {
        ...mockPagedResponse,
        content: [],
        totalElements: 0,
        empty: true
      };
      
      apiClientSpy.getAggregatedPaged.and.returnValue(of(emptyResponse));
      
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);

      const noDataElement = fixture.debugElement.query(By.css('.no-data'));
      expect(noDataElement).toBeTruthy();
      expect(noDataElement.nativeElement.textContent).toContain('No data available');
    }));

    it('should hide table when no data', fakeAsync(() => {
      const emptyResponse: PagedAggregatedData = {
        ...mockPagedResponse,
        content: [],
        totalElements: 0,
        empty: true
      };
      
      apiClientSpy.getAggregatedPaged.and.returnValue(of(emptyResponse));
      
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);

      const table = fixture.debugElement.query(By.directive(ActivityTableComponent));
      expect(table).toBeFalsy();
    }));
  });

  describe('BEM Styling', () => {
    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(ActivityAggregationComponent);
    component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);
    }));

    it('should have aggregation-card class', () => {
      const card = fixture.debugElement.query(By.css('.aggregation-card'));
      expect(card).toBeTruthy();
    });

    it('should have container class', () => {
      const container = fixture.debugElement.query(By.css('.container'));
      expect(container).toBeTruthy();
    });

    it('should have pagination-container class', () => {
      const paginationContainer = fixture.debugElement.query(
        By.css('.pagination-container')
      );
      expect(paginationContainer).toBeTruthy();
    });
  });

  describe('Reactive Updates', () => {
    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(ActivityAggregationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(200);
      apiClientSpy.getAggregatedPaged.calls.reset();
    }));

    it('should update UI when data changes', fakeAsync(() => {
      const newResponse: PagedAggregatedData = {
        ...mockPagedResponse,
        content: [
          { project: 'New Project', employee: 'New Employee', date: '2024-01-10', hours: 10 }
        ],
        totalElements: 1
      };

      apiClientSpy.getAggregatedPaged.and.returnValue(of(newResponse));
      service = fixture.debugElement.injector.get(ActivityService);
      service.toggleField(ACTIVITY_FIELDS.PROJECT);
      fixture.detectChanges();
      tick(200);

      const tableComponent = fixture.debugElement.query(
        By.directive(ActivityTableComponent)
      ).componentInstance;

      expect(tableComponent.data()[0].project).toBe('New Project');
    }));

    it('should update paginator when pagination changes', fakeAsync(() => {
      const newResponse: PagedAggregatedData = {
        ...mockPagedResponse,
        totalElements: 100,
        totalPages: 4,
        number: 2
      };

      apiClientSpy.getAggregatedPaged.and.returnValue(of(newResponse));
      service = fixture.debugElement.injector.get(ActivityService);
      
      const pageEvent: PageEvent = {
        pageIndex: 2,
        pageSize: 25,
        length: 100,
        previousPageIndex: 0
      };
      
      service.handlePageEvent(pageEvent);
      fixture.detectChanges();
      tick(200);

      const paginator = fixture.debugElement.query(By.css('mat-paginator'));
      expect(paginator.componentInstance.pageIndex).toBe(2);
    }));
  });
});
