import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from './services/activity';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { 
  ACTIVITY_FIELDS, 
  UI_CONFIG} from './constants/activity-aggregation';
import { ActivityFilterComponent } from './components/activity-filter/activity-filter';
import { ActivityTableComponent } from './components/activity-table/activity-table';

@Component({
  selector: 'app-activity-aggregation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    ActivityFilterComponent,
    ActivityTableComponent
  ],
  providers:[ActivityService],
  templateUrl: './activity-aggregation.html',
  styleUrl: './activity-aggregation.scss'
})
export class ActivityAggregationComponent {
  protected readonly service = inject(ActivityService);
  protected readonly ACTIVITY_FIELDS = ACTIVITY_FIELDS;
  protected readonly UI_CONFIG = UI_CONFIG;
}