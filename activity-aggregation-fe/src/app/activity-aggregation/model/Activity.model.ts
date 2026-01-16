export interface Activity {
    project: {
      id: number;
      name: string;
    };
    employee: {
      id: number;
      name: string;
    };
    date: string;
    hours: number;
  }
  
  export interface AggregatedData {
    project?: string;
    employee?: string;
    date?: string;
    hours: number;
  }
  
  export interface GroupBy {
    project: boolean;
    employee: boolean;
    date: boolean;
  }