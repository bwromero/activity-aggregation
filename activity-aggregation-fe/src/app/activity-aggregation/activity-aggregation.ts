import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AggregatedData, GroupBy } from './model/Activity.model';
import { ActivityService } from './services/activity-service';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-activity-aggregation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './activity-aggregation.html',
  styleUrl: './activity-aggregation.scss'
})
export class ActivityAggregationComponent implements OnInit {
  private activityService = inject(ActivityService);

  // State signals
  data = signal<AggregatedData[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Grouping options
  groupBy = signal<GroupBy>({
    project: false,
    employee: false,
    date: false
  });

  // Computed columns based on selected grouping
  displayedColumns = computed(() => {
    const columns: string[] = [];
    const grouping = this.groupBy();
    
    if (grouping.project) columns.push('project');
    if (grouping.employee) columns.push('employee');
    if (grouping.date) columns.push('date');
    columns.push('hours');
    
    return columns;
  });

  ngOnInit() {
    this.loadData();
  }

  toggleGroup(field: keyof GroupBy) {
    this.groupBy.update(current => ({
      ...current,
      [field]: !current[field]
    }));
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);

    const grouping = this.groupBy();
    const groupByFields: string[] = [];
    
    if (grouping.project) groupByFields.push('project');
    if (grouping.employee) groupByFields.push('employee');
    if (grouping.date) groupByFields.push('date');

    this.activityService.getAggregatedActivities(groupByFields).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load data: ' + err.message);
        this.loading.set(false);
      }
    });
  }
}