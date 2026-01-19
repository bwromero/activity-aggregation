import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { By } from '@angular/platform-browser';
import { ActivityTableComponent } from './activity-table';
import { AggregatedData } from '../../models/aggregated-data.model';
import { ACTIVITY_FIELDS } from '../../constants/activity-aggregation';

describe('ActivityTableComponent', () => {
  let component: ActivityTableComponent;
  let fixture: ComponentFixture<ActivityTableComponent>;

  const mockData: AggregatedData[] = [
    { project: 'Project A', employee: 'Alice', date: '2024-01-01', hours: 8 },
    { project: 'Project B', employee: 'Bob', date: '2024-01-02', hours: 6 }
  ];

  const allColumns = [
    ACTIVITY_FIELDS.PROJECT,
    ACTIVITY_FIELDS.EMPLOYEE,
    ACTIVITY_FIELDS.DATE,
    ACTIVITY_FIELDS.HOURS
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityTableComponent, MatTableModule, DatePipe]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityTableComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      fixture.componentRef.setInput('data', []);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
      
      expect(component).toBeTruthy();
    });
  });

  describe('Input Signals', () => {
    it('should accept data input', () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
      
      expect(component.data()).toEqual(mockData);
    });

    it('should accept displayedColumns input', () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
      
      expect(component.displayedColumns()).toEqual(allColumns);
    });
  });

  describe('trackById', () => {
    it('should generate unique id for complete record', () => {
      const item: AggregatedData = {
        project: 'Project A',
        employee: 'Alice',
        date: '2024-01-01',
        hours: 8
      };
      
      const id = component.trackById(0, item);
      expect(id).toBe('Project A-Alice-2024-01-01');
    });

    it('should handle undefined fields', () => {
      const item: AggregatedData = {
        project: 'Project A',
        hours: 8
      };
      
      const id = component.trackById(0, item);
      expect(id).toBe('Project A-undefined-undefined');
    });
  });

  describe('Table Rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
    });

    it('should render mat-table', () => {
      const table = fixture.debugElement.query(By.css('table[mat-table]'));
      expect(table).toBeTruthy();
    });

    it('should render correct number of rows', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      expect(rows.length).toBe(mockData.length);
    });
  });
});
