import { Component, signal } from '@angular/core';
import { ActivityAggregationComponent } from './activity-aggregation/activity-aggregation';

@Component({
  selector: 'app-root',
  imports: [ActivityAggregationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('activity-aggregation-fe');
}
