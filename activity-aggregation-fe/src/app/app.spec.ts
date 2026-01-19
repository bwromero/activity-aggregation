import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { App } from './app';
import { ActivityApiClient } from './activity-aggregation/utils/activity-api';
import { PagedAggregatedData } from './activity-aggregation/models/aggregated-data.model';

describe('App', () => {
  const mockPagedResponse: PagedAggregatedData = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 25,
    first: true,
    last: true,
    empty: true
  };

  beforeEach(async () => {
    const apiClientSpy = jasmine.createSpyObj('ActivityApiClient', ['getAggregatedPaged']);
    apiClientSpy.getAggregatedPaged.and.returnValue(of(mockPagedResponse));

    await TestBed.configureTestingModule({
      imports: [App, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivityApiClient, useValue: apiClientSpy }
      ]
    }).compileComponents();
  });

  it('should create the app', (done) => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(app).toBeTruthy();
      done();
    }, 250);
  });
});
