import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityTableComponent } from './activity-table';

describe('ActivityTableComponent', () => {
  let component: ActivityTableComponent;
  let fixture: ComponentFixture<ActivityTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
