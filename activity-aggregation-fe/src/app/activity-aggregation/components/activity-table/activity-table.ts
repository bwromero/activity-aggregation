import { Component, input } from '@angular/core';
import { ACTIVITY_FIELDS, ActivityField, COLUMN_CONFIGS } from '../../constants/activity-aggregation';
import { AggregatedData } from '../../models/aggregated-data.model';
import { MatTableModule } from '@angular/material/table';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-activity-table',
  imports: [MatTableModule, DatePipe],
  templateUrl: './activity-table.html',
  styleUrl: './activity-table.scss',
})
export class ActivityTableComponent {
  protected readonly ACTIVITY_FIELDS = ACTIVITY_FIELDS;
  protected readonly COLUMN_CONFIGS = COLUMN_CONFIGS;

  readonly data = input.required<AggregatedData[]>();
  readonly displayedColumns = input.required<ActivityField[]>();
}
