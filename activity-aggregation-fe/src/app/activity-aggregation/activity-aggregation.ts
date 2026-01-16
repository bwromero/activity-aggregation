import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AggregatedData } from './model/Activity.model';
import { ActivityService } from './services/activity-service';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

type GroupByField = 'project' | 'employee' | 'date';

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

  data = signal<AggregatedData[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  selectedFields = signal<GroupByField[]>([]);

  isSelected = (field: GroupByField) => {
    return computed(() => this.selectedFields().includes(field));
  };

  displayedColumns = computed(() => {
    const selected = this.selectedFields();
    
    if (selected.length === 0) {
      return ['project', 'employee', 'date', 'hours'];
    }
    
    return [...selected, 'hours'];
  });

  constructor() {
    effect(() => {
      this.selectedFields();
      this.loadData();
    });
  }

  ngOnInit() {
  }

  toggleGroup(field: GroupByField) {
    this.selectedFields.update(current => {
      if (current.includes(field)) {
        return current.filter(f => f !== field);
      } else {
        return [...current, field];
      }
    });
  }

  isProjectSelected = computed(() => this.selectedFields().includes('project'));
  isEmployeeSelected = computed(() => this.selectedFields().includes('employee'));
  isDateSelected = computed(() => this.selectedFields().includes('date'));

  loadData() {
    this.loading.set(true);
    this.error.set(null);

    const groupByFields = this.selectedFields();

    this.activityService.getAggregatedActivities(groupByFields).subscribe({
      next: (data) => {
        console.log('Data received:', data); 
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