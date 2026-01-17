import { Component, input, output } from '@angular/core';
import { ACTIVITY_FIELDS, COLUMN_CONFIGS, GroupByField } from '../../constants/activity-aggregation';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-activity-filter',
  imports: [MatCheckboxModule],
  templateUrl: './activity-filter.html',
  styleUrl: './activity-filter.scss',
})
export class ActivityFilterComponent {
  protected readonly ACTIVITY_FIELDS = ACTIVITY_FIELDS;
  protected readonly COLUMN_CONFIGS = COLUMN_CONFIGS;

  readonly isProjectSelected = input.required<boolean>();
  readonly isEmployeeSelected = input.required<boolean>();
  readonly isDateSelected = input.required<boolean>();
  readonly fieldToggled = output<GroupByField>();
}
