import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ActivityAggregationComponent } from './activity-aggregation';
import { ActivityApiClient } from './utils/activity-api';
import { PagedAggregatedData } from './models/aggregated-data.model';

describe('ActivityAggregationComponent', () => {
  let component: ActivityAggregationComponent;
  let fixture: ComponentFixture<ActivityAggregationComponent>;
  let apiClientSpy: jasmine.SpyObj<ActivityApiClient>;

  const mockPagedResponse: PagedAggregatedData = {
    content: [
      { project: 'Project A', employee: 'Alice', date: '2024-01-01', hours: 8 }
    ],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 25,
    first: true,
    last: true,
    empty: false
  };

  beforeEach(async () => {
    const apiClientSpyObj = jasmine.createSpyObj('ActivityApiClient', ['getAggregatedPaged']);
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
    fixture = TestBed.createComponent(ActivityAggregationComponent);
    component = fixture.componentInstance;
  });

  it('should create', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(component).toBeTruthy();
      done();
    }, 250);
  });
});
