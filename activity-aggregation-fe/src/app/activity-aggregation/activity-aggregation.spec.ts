import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityAggregation } from './activity-aggregation';

describe('ActivityAggregation', () => {
  let component: ActivityAggregation;
  let fixture: ComponentFixture<ActivityAggregation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityAggregation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityAggregation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
