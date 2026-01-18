
export class StateHelpers {

    static hasData(loading: boolean, error: string | null, dataLength: number): boolean {
      return !loading && !error && dataLength > 0;
    }
  
    static showNoData(loading: boolean, error: string | null, dataLength: number): boolean {
      return !loading && !error && dataLength === 0;
    }
  
    static extractErrorMessage(err: any, prefix: string = ''): string {
      const message = err.error?.message || err.message || 'Unknown error';
      return prefix ? `${prefix}: ${message}` : message;
    }
  }