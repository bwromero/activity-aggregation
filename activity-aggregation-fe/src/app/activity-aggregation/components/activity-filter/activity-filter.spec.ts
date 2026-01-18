import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
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
      // Set required inputs
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.componentRef.setInput('isEmployeeSelected', false);
      fixture.componentRef.setInput('isDateSelected', false);
      
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have constants defined', () => {
      expect(component['ACTIVITY_FIELDS']).toBeDefined();
      expect(component['COLUMN_CONFIGS']).toBeDefined();
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

    it('should accept isEmployeeSelected input', () => {
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.componentRef.setInput('isEmployeeSelected', true);
      fixture.componentRef.setInput('isDateSelected', false);
      
      fixture.detectChanges();
      expect(component.isEmployeeSelected()).toBe(true);
    });

    it('should accept isDateSelected input', () => {
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.componentRef.setInput('isEmployeeSelected', false);
      fixture.componentRef.setInput('isDateSelected', true);
      
      fixture.detectChanges();
      expect(component.isDateSelected()).toBe(true);
    });

    it('should handle all inputs being true', () => {
      fixture.componentRef.setInput('isProjectSelected', true);
      fixture.componentRef.setInput('isEmployeeSelected', true);
      fixture.componentRef.setInput('isDateSelected', true);
      
      fixture.detectChanges();
      
      expect(component.isProjectSelected()).toBe(true);
      expect(component.isEmployeeSelected()).toBe(true);
      expect(component.isDateSelected()).toBe(true);
    });

    it('should handle all inputs being false', () => {
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.componentRef.setInput('isEmployeeSelected', false);
      fixture.componentRef.setInput('isDateSelected', false);
      
      fixture.detectChanges();
      
      expect(component.isProjectSelected()).toBe(false);
      expect(component.isEmployeeSelected()).toBe(false);
      expect(component.isDateSelected()).toBe(false);
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

    it('should render checkboxes as unchecked when inputs are false', () => {
      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      
      checkboxes.forEach(checkbox => {
        const input = checkbox.nativeElement.querySelector('input[type="checkbox"]');
        expect(input.checked).toBe(false);
      });
    });

    it('should render project checkbox as checked when isProjectSelected is true', () => {
      fixture.componentRef.setInput('isProjectSelected', true);
      fixture.detectChanges();
      
      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      const projectCheckbox = checkboxes.find(cb => 
        cb.nativeElement.textContent.trim().includes('Project')
      );
      
      expect(projectCheckbox).toBeTruthy();
      const input = projectCheckbox?.nativeElement.querySelector('input[type="checkbox"]');
      expect(input?.checked).toBe(true);
    });
  });

  describe('Output Events', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.componentRef.setInput('isEmployeeSelected', false);
      fixture.componentRef.setInput('isDateSelected', false);
      fixture.detectChanges();
    });

    it('should emit fieldToggled when project checkbox is clicked', (done) => {
      component.fieldToggled.subscribe((field) => {
        expect(field).toBe(ACTIVITY_FIELDS.PROJECT);
        done();
      });

      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      const projectCheckbox = checkboxes.find(cb => 
        cb.nativeElement.textContent.trim().includes('Project')
      );
      
      projectCheckbox?.nativeElement.click();
    });

    it('should emit fieldToggled when employee checkbox is clicked', (done) => {
      component.fieldToggled.subscribe((field) => {
        expect(field).toBe(ACTIVITY_FIELDS.EMPLOYEE);
        done();
      });

      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      const employeeCheckbox = checkboxes.find(cb => 
        cb.nativeElement.textContent.trim().includes('Employee')
      );
      
      employeeCheckbox?.nativeElement.click();
    });

    it('should emit fieldToggled when date checkbox is clicked', (done) => {
      component.fieldToggled.subscribe((field) => {
        expect(field).toBe(ACTIVITY_FIELDS.DATE);
        done();
      });

      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      const dateCheckbox = checkboxes.find(cb => 
        cb.nativeElement.textContent.trim().includes('Date')
      );
      
      dateCheckbox?.nativeElement.click();
    });

    it('should emit correct field on multiple clicks', () => {
      const emittedFields: string[] = [];
      
      component.fieldToggled.subscribe((field) => {
        emittedFields.push(field);
      });

      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      
      // Click project
      checkboxes[0].nativeElement.click();
      // Click employee
      checkboxes[1].nativeElement.click();
      // Click date
      checkboxes[2].nativeElement.click();

      expect(emittedFields.length).toBe(3);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.componentRef.setInput('isEmployeeSelected', false);
      fixture.componentRef.setInput('isDateSelected', false);
      fixture.detectChanges();
    });

    it('should have proper checkbox structure', () => {
      const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      
      checkboxes.forEach(checkbox => {
        const input = checkbox.nativeElement.querySelector('input[type="checkbox"]');
        expect(input).toBeTruthy();
      });
    });

    it('should have BEM class structure', () => {
      const container = fixture.debugElement.query(By.css('.activity-filter'));
      expect(container).toBeTruthy();
      
      const checkboxes = fixture.debugElement.queryAll(By.css('.activity-filter__checkbox'));
      expect(checkboxes.length).toBe(3);
    });
  });

  describe('Reactive Updates', () => {
    it('should update UI when inputs change', () => {
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.componentRef.setInput('isEmployeeSelected', false);
      fixture.componentRef.setInput('isDateSelected', false);
      fixture.detectChanges();

      let checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      let projectCheckbox = checkboxes.find(cb => 
        cb.nativeElement.textContent.trim().includes('Project')
      );
      let input = projectCheckbox?.nativeElement.querySelector('input[type="checkbox"]');
      expect(input?.checked).toBe(false);

      // Update input
      fixture.componentRef.setInput('isProjectSelected', true);
      fixture.detectChanges();

      checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
      projectCheckbox = checkboxes.find(cb => 
        cb.nativeElement.textContent.trim().includes('Project')
      );
      input = projectCheckbox?.nativeElement.querySelector('input[type="checkbox"]');
      expect(input?.checked).toBe(true);
    });

    it('should handle rapid input changes', () => {
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.componentRef.setInput('isEmployeeSelected', false);
      fixture.componentRef.setInput('isDateSelected', false);
      fixture.detectChanges();

      // Rapid changes
      fixture.componentRef.setInput('isProjectSelected', true);
      fixture.detectChanges();
      
      fixture.componentRef.setInput('isProjectSelected', false);
      fixture.detectChanges();
      
      fixture.componentRef.setInput('isProjectSelected', true);
      fixture.detectChanges();

      expect(component.isProjectSelected()).toBe(true);
    });
  });
});
