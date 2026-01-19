import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { By } from '@angular/platform-browser';
import { ActivityFilterComponent } from './activity-filter';
import { ACTIVITY_FIELDS } from '../../constants/activity-aggregation';

describe('ActivityFilterComponent', () => {
  let component: ActivityFilterComponent;
  let fixture: ComponentFixture<ActivityFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityFilterComponent, MatCheckboxModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityFilterComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.componentRef.setInput('isEmployeeSelected', false);
      fixture.componentRef.setInput('isDateSelected', false);
      
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  describe('Input Signals', () => {
    it('should accept isProjectSelected input', () => {
      fixture.componentRef.setInput('isProjectSelected', true);
      fixture.componentRef.setInput('isEmployeeSelected', false);
      fixture.componentRef.setInput('isDateSelected', false);
      
      fixture.detectChanges();
      expect(component.isProjectSelected()).toBe(true);
    });

    it('should accept all inputs being true', () => {
      fixture.componentRef.setInput('isProjectSelected', true);
      fixture.componentRef.setInput('isEmployeeSelected', true);
      fixture.componentRef.setInput('isDateSelected', true);
      
      fixture.detectChanges();
      
      expect(component.isProjectSelected()).toBe(true);
      expect(component.isEmployeeSelected()).toBe(true);
      expect(component.isDateSelected()).toBe(true);
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.componentRef.setInput('isEmployeeSelected', false);
      fixture.componentRef.setInput('isDateSelected', false);
      fixture.detectChanges();
    });

    it('should render three checkboxes', () => {
      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      expect(checkboxes.length).toBe(3);
    });

    it('should display correct labels', () => {
      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      const labels = checkboxes.map(cb => cb.nativeElement.textContent.trim());
      
      expect(labels).toContain('Project');
      expect(labels).toContain('Employee');
      expect(labels).toContain('Date');
    });
  });

  describe('Output Events', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.componentRef.setInput('isEmployeeSelected', false);
      fixture.componentRef.setInput('isDateSelected', false);
      fixture.detectChanges();
    });

    it('should emit fieldToggled when checkbox is changed', (done) => {
      let emittedValue: string | null = null;
      
      component.fieldToggled.subscribe((field) => {
        emittedValue = field;
      });

      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      checkboxes[0].triggerEventHandler('change', null);
      
      setTimeout(() => {
        expect(emittedValue).toBe(ACTIVITY_FIELDS.PROJECT);
        done();
      }, 50);
    });

    it('should emit correct field for each checkbox', () => {
      const emittedFields: string[] = [];
      
      component.fieldToggled.subscribe((field) => {
        emittedFields.push(field);
      });

      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      checkboxes[0].triggerEventHandler('change', null);
      checkboxes[1].triggerEventHandler('change', null);
      checkboxes[2].triggerEventHandler('change', null);
      
      expect(emittedFields).toContain(ACTIVITY_FIELDS.PROJECT);
      expect(emittedFields).toContain(ACTIVITY_FIELDS.EMPLOYEE);
      expect(emittedFields).toContain(ACTIVITY_FIELDS.DATE);
    });
  });
});
