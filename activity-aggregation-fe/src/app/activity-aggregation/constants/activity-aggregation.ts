export const ACTIVITY_FIELDS = {
  PROJECT: 'project',
  EMPLOYEE: 'employee',
  DATE: 'date',
  HOURS: 'hours'
} as const;

export type ActivityField = typeof ACTIVITY_FIELDS[keyof typeof ACTIVITY_FIELDS];

export const GROUPABLE_FIELDS = [
  ACTIVITY_FIELDS.PROJECT,
  ACTIVITY_FIELDS.EMPLOYEE,
  ACTIVITY_FIELDS.DATE
] as const;

export type GroupByField = typeof GROUPABLE_FIELDS[number];

export interface ColumnConfig {
  field: ActivityField;
  label: string;
  format?: string;
  cssClass?: string;
  sortable?: boolean;
}

export const COLUMN_CONFIGS: Record<ActivityField, ColumnConfig> = {
  [ACTIVITY_FIELDS.PROJECT]: {
    field: ACTIVITY_FIELDS.PROJECT,
    label: 'Project',
    sortable: true
  },
  [ACTIVITY_FIELDS.EMPLOYEE]: {
    field: ACTIVITY_FIELDS.EMPLOYEE,
    label: 'Employee',
    sortable: true
  },
  [ACTIVITY_FIELDS.DATE]: {
    field: ACTIVITY_FIELDS.DATE,
    label: 'Date',
    format: 'dd MMM yyyy',
    sortable: true
  },
  [ACTIVITY_FIELDS.HOURS]: {
    field: ACTIVITY_FIELDS.HOURS,
    label: 'Hours',
    cssClass: 'hours-cell',
    sortable: true
  }
} as const;

export const API_CONFIG = {
  endpoints: {
    activities: '/api/activities',
    aggregate: '/aggregate'
  },
  queryParams: {
    groupBy: 'groupBy'
  }
} as const;

export const UI_CONFIG = {
  spinner: {
    diameter: 50
  },
  messages: {
    noData: 'No data available.',
    loadingError: 'Failed to load data',
    groupByLabel: 'Group fields by:'
  }
} as const;

export const DEFAULT_COLUMNS: ActivityField[] = [
  ACTIVITY_FIELDS.PROJECT,
  ACTIVITY_FIELDS.EMPLOYEE,
  ACTIVITY_FIELDS.DATE,
  ACTIVITY_FIELDS.HOURS
];