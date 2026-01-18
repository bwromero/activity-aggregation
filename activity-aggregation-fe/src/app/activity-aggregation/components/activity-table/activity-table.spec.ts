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
    { project: 'Project B', employee: 'Bob', date: '2024-01-02', hours: 6 },
    { project: 'Project C', employee: 'Charlie', date: '2024-01-03', hours: 7 }
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

    it('should have constants defined', () => {
      expect(component['ACTIVITY_FIELDS']).toBeDefined();
      expect(component['COLUMN_CONFIGS']).toBeDefined();
    });

    it('should use OnPush change detection', () => {
      const changeDetection = (component.constructor as any).ɵcmp.changeDetection;
      expect(changeDetection).toBe(1); // ChangeDetectionStrategy.OnPush
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

    it('should accept empty data array', () => {
      fixture.componentRef.setInput('data', []);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
      
      expect(component.data()).toEqual([]);
    });

    it('should accept subset of columns', () => {
      const subsetColumns = [ACTIVITY_FIELDS.PROJECT, ACTIVITY_FIELDS.HOURS];
      
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('displayedColumns', subsetColumns);
      fixture.detectChanges();
      
      expect(component.displayedColumns()).toEqual(subsetColumns);
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

    it('should handle undefined project', () => {
      const item: AggregatedData = {
        employee: 'Alice',
        date: '2024-01-01',
        hours: 8
      };
      
      const id = component.trackById(0, item);
      expect(id).toBe('undefined-Alice-2024-01-01');
    });

    it('should handle undefined employee', () => {
      const item: AggregatedData = {
        project: 'Project A',
        date: '2024-01-01',
        hours: 8
      };
      
      const id = component.trackById(0, item);
      expect(id).toBe('Project A-undefined-2024-01-01');
    });

    it('should handle undefined date', () => {
      const item: AggregatedData = {
        project: 'Project A',
        employee: 'Alice',
        hours: 8
      };
      
      const id = component.trackById(0, item);
      expect(id).toBe('Project A-Alice-undefined');
    });

    it('should generate different ids for different records', () => {
      const item1: AggregatedData = {
        project: 'Project A',
        employee: 'Alice',
        date: '2024-01-01',
        hours: 8
      };
      
      const item2: AggregatedData = {
        project: 'Project B',
        employee: 'Bob',
        date: '2024-01-02',
        hours: 6
      };
      
      const id1 = component.trackById(0, item1);
      const id2 = component.trackById(1, item2);
      
      expect(id1).not.toBe(id2);
    });

    it('should generate same id for same record content regardless of index', () => {
      const item: AggregatedData = {
        project: 'Project A',
        employee: 'Alice',
        date: '2024-01-01',
        hours: 8
      };
      
      const id1 = component.trackById(0, item);
      const id2 = component.trackById(5, item);
      
      expect(id1).toBe(id2);
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

    it('should render header row', () => {
      const headerRow = fixture.debugElement.query(By.css('tr.mat-mdc-header-row'));
      expect(headerRow).toBeTruthy();
    });

    it('should render correct data in cells', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      const firstRowCells = rows[0].queryAll(By.css('td.mat-mdc-cell'));
      
      // Check that cells contain data from first record
      const cellTexts = firstRowCells.map(cell => cell.nativeElement.textContent.trim());
      expect(cellTexts).toContain('Project A');
      expect(cellTexts).toContain('Alice');
      expect(cellTexts).toContain('8');
    });

    it('should render all column headers', () => {
      const headers = fixture.debugElement.queryAll(By.css('th.mat-mdc-header-cell'));
      const headerTexts = headers.map(h => h.nativeElement.textContent.trim());
      
      expect(headerTexts).toContain('Project');
      expect(headerTexts).toContain('Employee');
      expect(headerTexts).toContain('Date');
      expect(headerTexts).toContain('Hours');
    });
  });

  describe('Dynamic Column Display', () => {
    it('should display only selected columns', () => {
      const selectedColumns = [ACTIVITY_FIELDS.PROJECT, ACTIVITY_FIELDS.HOURS];
      
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('displayedColumns', selectedColumns);
      fixture.detectChanges();
      
      const headers = fixture.debugElement.queryAll(By.css('th.mat-mdc-header-cell'));
      const headerTexts = headers.map(h => h.nativeElement.textContent.trim());
      
      expect(headerTexts).toContain('Project');
      expect(headerTexts).toContain('Hours');
      expect(headers.length).toBe(2);
    });

    it('should update displayed columns when input changes', () => {
      // Start with all columns
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
      
      let headers = fixture.debugElement.queryAll(By.css('th.mat-mdc-header-cell'));
      expect(headers.length).toBe(4);
      
      // Change to subset
      const subset = [ACTIVITY_FIELDS.EMPLOYEE, ACTIVITY_FIELDS.HOURS];
      fixture.componentRef.setInput('displayedColumns', subset);
      fixture.detectChanges();
      
      headers = fixture.debugElement.queryAll(By.css('th.mat-mdc-header-cell'));
      expect(headers.length).toBe(2);
    });
  });

  describe('Empty State', () => {
    it('should handle empty data array', () => {
      fixture.componentRef.setInput('data', []);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
      
      const rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      expect(rows.length).toBe(0);
    });

    it('should still render headers with empty data', () => {
      fixture.componentRef.setInput('data', []);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
      
      const headers = fixture.debugElement.queryAll(By.css('th.mat-mdc-header-cell'));
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('Data Updates', () => {
    it('should update table when data changes', () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
      
      let rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      expect(rows.length).toBe(3);
      
      // Update data
      const newData: AggregatedData[] = [
        { project: 'Project D', employee: 'Dave', date: '2024-01-04', hours: 5 }
      ];
      
      fixture.componentRef.setInput('data', newData);
      fixture.detectChanges();
      
      rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      expect(rows.length).toBe(1);
    });

    it('should handle adding more data', () => {
      fixture.componentRef.setInput('data', [mockData[0]]);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
      
      let rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      expect(rows.length).toBe(1);
      
      // Add more data
      fixture.componentRef.setInput('data', mockData);
      fixture.detectChanges();
      
      rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      expect(rows.length).toBe(3);
    });
  });

  describe('Hours Column Styling', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
    });

    it('should apply special class to hours header', () => {
      const headers = fixture.debugElement.queryAll(By.css('th.mat-mdc-header-cell'));
      const hoursHeader = headers.find(h => 
        h.nativeElement.textContent.trim() === 'Hours'
      );
      
      expect(hoursHeader?.nativeElement.classList.contains('activity-table__header--hours'))
        .toBe(true);
    });

    it('should apply special class to hours cells', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      const firstRow = rows[0];
      const cells = firstRow.queryAll(By.css('td.mat-mdc-cell'));
      
      // Find hours cell (should contain numeric value)
      const hoursCell = cells.find(c => 
        !isNaN(Number(c.nativeElement.textContent.trim()))
      );
      
      expect(hoursCell?.nativeElement.classList.contains('activity-table__cell--hours'))
        .toBe(true);
    });
  });

  describe('BEM Structure', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
    });

    it('should have activity-table container', () => {
      const container = fixture.debugElement.query(By.css('.activity-table'));
      expect(container).toBeTruthy();
    });

    it('should have activity-table__container', () => {
      const container = fixture.debugElement.query(By.css('.activity-table__container'));
      expect(container).toBeTruthy();
    });

    it('should have activity-table__mat-table', () => {
      const table = fixture.debugElement.query(By.css('.activity-table__mat-table'));
      expect(table).toBeTruthy();
    });
  });

  describe('Data with Optional Fields', () => {
    it('should handle data with missing project field', () => {
      const dataWithMissingField: AggregatedData[] = [
        { employee: 'Alice', date: '2024-01-01', hours: 8 }
      ];
      
      fixture.componentRef.setInput('data', dataWithMissingField);
      fixture.componentRef.setInput('displayedColumns', allColumns);
      fixture.detectChanges();
      
      const rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      expect(rows.length).toBe(1);
    });

    it('should handle data aggregated by single field', () => {
      const aggregatedData: AggregatedData[] = [
        { project: 'Project A', hours: 15 },
        { project: 'Project B', hours: 12 }
      ];
      
      const displayColumns = [ACTIVITY_FIELDS.PROJECT, ACTIVITY_FIELDS.HOURS];
      
      fixture.componentRef.setInput('data', aggregatedData);
      fixture.componentRef.setInput('displayedColumns', displayColumns);
      fixture.detectChanges();
      
      const rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      expect(rows.length).toBe(2);
    });
  });
});
