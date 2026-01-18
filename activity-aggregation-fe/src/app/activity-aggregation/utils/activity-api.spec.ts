import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ActivityApiClient } from './activity-api';
import { ACTIVITY_FIELDS } from '../constants/activity-aggregation';
import { environment } from '../../../environments/environment';

describe('ActivityApiClient', () => {
  let client: ActivityApiClient;
  let httpMock: HttpTestingController;
  
  const baseUrl = `${environment.apiBaseUrl}/api/activities`;

  const mockBackendResponse = {
    content: [
      { project: 'Project A', employee: 'Alice', date: '2024-01-01', hours: 8 },
      { project: 'Project B', employee: 'Bob', date: '2024-01-02', hours: 6 }
    ],
    page: {
      totalElements: 50,
      totalPages: 2,
      number: 0,
      size: 25
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ActivityApiClient
      ]
    });

    client = TestBed.inject(ActivityApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(client).toBeTruthy();
    });
  });

  describe('getAggregatedPaged', () => {
    it('should make GET request to correct endpoint', () => {
      client.getAggregatedPaged([], 0, 25).subscribe();

      const req = httpMock.expectOne(request => 
        request.url === `${baseUrl}/aggregate`
      );
      expect(req.request.method).toBe('GET');
      
      req.flush(mockBackendResponse);
    });

    it('should include page and size parameters', () => {
      client.getAggregatedPaged([], 2, 50).subscribe();

      const req = httpMock.expectOne(request => 
        request.url.includes('page=2') && request.url.includes('size=50')
      );
      
      req.flush(mockBackendResponse);
    });

    it('should include groupBy parameter when fields provided', () => {
      const groupBy = [ACTIVITY_FIELDS.PROJECT, ACTIVITY_FIELDS.EMPLOYEE];
      
      client.getAggregatedPaged(groupBy, 0, 25).subscribe();

      const req = httpMock.expectOne(request => 
        request.url.includes('groupBy=project,employee')
      );
      
      req.flush(mockBackendResponse);
    });

    it('should not include groupBy parameter when empty array', () => {
      client.getAggregatedPaged([], 0, 25).subscribe();

      const req = httpMock.expectOne(request => 
        !request.url.includes('groupBy')
      );
      
      req.flush(mockBackendResponse);
    });

    it('should include sort parameter when provided', () => {
      client.getAggregatedPaged([], 0, 25, 'project,asc').subscribe();

      const req = httpMock.expectOne(request => 
        request.url.includes('sort=project,asc')
      );
      
      req.flush(mockBackendResponse);
    });

    it('should not include sort parameter when not provided', () => {
      client.getAggregatedPaged([], 0, 25).subscribe();

      const req = httpMock.expectOne(request => 
        !request.url.includes('sort')
      );
      
      req.flush(mockBackendResponse);
    });

    it('should transform backend response to PagedAggregatedData', (done) => {
      client.getAggregatedPaged([], 0, 25).subscribe(response => {
        expect(response.content).toEqual(mockBackendResponse.content);
        expect(response.totalElements).toBe(mockBackendResponse.page.totalElements);
        expect(response.totalPages).toBe(mockBackendResponse.page.totalPages);
        expect(response.number).toBe(mockBackendResponse.page.number);
        expect(response.size).toBe(mockBackendResponse.page.size);
        expect(response.first).toBe(true);
        expect(response.last).toBe(false);
        expect(response.empty).toBe(false);
        done();
      });

      const req = httpMock.expectOne(request => 
        request.url === `${baseUrl}/aggregate`
      );
      req.flush(mockBackendResponse);
    });

    it('should calculate first flag correctly', (done) => {
      const firstPageResponse = {
        ...mockBackendResponse,
        page: { ...mockBackendResponse.page, number: 0 }
      };

      client.getAggregatedPaged([], 0, 25).subscribe(response => {
        expect(response.first).toBe(true);
        done();
      });

      const req = httpMock.expectOne(() => true);
      req.flush(firstPageResponse);
    });

    it('should calculate last flag correctly', (done) => {
      const lastPageResponse = {
        ...mockBackendResponse,
        page: { ...mockBackendResponse.page, number: 1, totalPages: 2 }
      };

      client.getAggregatedPaged([], 1, 25).subscribe(response => {
        expect(response.last).toBe(true);
        done();
      });

      const req = httpMock.expectOne(() => true);
      req.flush(lastPageResponse);
    });

    it('should calculate empty flag for empty content', (done) => {
      const emptyResponse = {
        ...mockBackendResponse,
        content: []
      };

      client.getAggregatedPaged([], 0, 25).subscribe(response => {
        expect(response.empty).toBe(true);
        done();
      });

      const req = httpMock.expectOne(() => true);
      req.flush(emptyResponse);
    });

    it('should handle single groupBy field', () => {
      client.getAggregatedPaged([ACTIVITY_FIELDS.PROJECT], 0, 25).subscribe();

      const req = httpMock.expectOne(request => 
        request.url.includes('groupBy=project')
      );
      
      req.flush(mockBackendResponse);
    });

    it('should handle multiple groupBy fields', () => {
      const groupBy = [
        ACTIVITY_FIELDS.PROJECT,
        ACTIVITY_FIELDS.EMPLOYEE,
        ACTIVITY_FIELDS.DATE
      ];
      
      client.getAggregatedPaged(groupBy, 0, 25).subscribe();

      const req = httpMock.expectOne(request => 
        request.url.includes('groupBy=project,employee,date')
      );
      
      req.flush(mockBackendResponse);
    });

    it('should use default parameters when not provided', () => {
      client.getAggregatedPaged([]).subscribe();

      const req = httpMock.expectOne(request => 
        request.url.includes('page=0') && request.url.includes('size=25')
      );
      
      req.flush(mockBackendResponse);
    });
  });

  describe('Error Handling', () => {
    it('should propagate HTTP errors', (done) => {
      client.getAggregatedPaged([], 0, 25).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(() => true);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should log errors to console', (done) => {
      spyOn(console, 'error');

      client.getAggregatedPaged([], 0, 25).subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          expect(console.error).toHaveBeenCalledWith(
            'API fetch error:',
            jasmine.anything()
          );
          done();
        }
      });

      const req = httpMock.expectOne(() => true);
      req.flush('Network error', { status: 0, statusText: 'Unknown Error' });
    });

    it('should handle network errors', (done) => {
      client.getAggregatedPaged([], 0, 25).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(() => true);
      req.error(new ProgressEvent('error'), { status: 0 });
    });

    it('should handle 404 errors', (done) => {
      client.getAggregatedPaged([], 0, 25).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(() => true);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle malformed response', (done) => {
      client.getAggregatedPaged([], 0, 25).subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          done();
        }
      });

      const req = httpMock.expectOne(() => true);
      req.flush(null);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', (done) => {
      let attemptCount = 0;

      client.getAggregatedPaged([], 0, 25).subscribe({
        next: () => {
          // Should succeed after retries
          expect(attemptCount).toBeGreaterThan(1);
          done();
        }
      });

      // Simulate multiple requests due to retries
      const requests = httpMock.match(() => true);
      
      // Fail first two attempts
      requests.slice(0, 2).forEach(req => {
        attemptCount++;
        req.flush('Error', { status: 500, statusText: 'Error' });
      });

      // Succeed on third attempt
      setTimeout(() => {
        const finalReq = httpMock.expectOne(() => true);
        attemptCount++;
        finalReq.flush(mockBackendResponse);
      }, 2100); // After retry delay
    });
  });

  describe('buildParams (indirectly tested)', () => {
    it('should build params with all parameters', () => {
      const groupBy = [ACTIVITY_FIELDS.PROJECT];
      
      client.getAggregatedPaged(groupBy, 3, 100, 'hours,desc').subscribe();

      const req = httpMock.expectOne(request => {
        const url = request.url;
        return url.includes('page=3') &&
               url.includes('size=100') &&
               url.includes('groupBy=project') &&
               url.includes('sort=hours,desc');
      });
      
      req.flush(mockBackendResponse);
    });

    it('should handle special characters in parameters', () => {
      client.getAggregatedPaged([], 0, 25, 'name,asc').subscribe();

      const req = httpMock.expectOne(() => true);
      expect(req.request.params.get('sort')).toBe('name,asc');
      
      req.flush(mockBackendResponse);
    });
  });

  describe('Response Transformation', () => {
    it('should correctly transform middle page', (done) => {
      const middlePageResponse = {
        ...mockBackendResponse,
        page: {
          totalElements: 100,
          totalPages: 4,
          number: 2,
          size: 25
        }
      };

      client.getAggregatedPaged([], 2, 25).subscribe(response => {
        expect(response.first).toBe(false);
        expect(response.last).toBe(false);
        expect(response.number).toBe(2);
        done();
      });

      const req = httpMock.expectOne(() => true);
      req.flush(middlePageResponse);
    });

    it('should handle single page result', (done) => {
      const singlePageResponse = {
        ...mockBackendResponse,
        page: {
          totalElements: 10,
          totalPages: 1,
          number: 0,
          size: 25
        }
      };

      client.getAggregatedPaged([], 0, 25).subscribe(response => {
        expect(response.first).toBe(true);
        expect(response.last).toBe(true);
        expect(response.totalPages).toBe(1);
        done();
      });

      const req = httpMock.expectOne(() => true);
      req.flush(singlePageResponse);
    });
  });
});
