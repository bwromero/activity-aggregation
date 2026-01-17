import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityFilterComponent } from './activity-filter';

describe('ActivityFilterComponent', () => {
  let component: ActivityFilterComponent;
  let fixture: ComponentFixture<ActivityFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityFilterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
