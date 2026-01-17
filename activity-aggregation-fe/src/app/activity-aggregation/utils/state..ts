/**
 * Helper functions for common state computations
 */
export class StateHelpers {
    /**
     * Check if data state indicates data is present
     */
    static hasData(loading: boolean, error: string | null, dataLength: number): boolean {
      return !loading && !error && dataLength > 0;
    }
  
    /**
     * Check if data state indicates no data
     */
    static showNoData(loading: boolean, error: string | null, dataLength: number): boolean {
      return !loading && !error && dataLength === 0;
    }
  
    /**
     * Extract error message from HttpErrorResponse
     */
    static extractErrorMessage(err: any, prefix: string = ''): string {
      const message = err.error?.message || err.message || 'Unknown error';
      return prefix ? `${prefix}: ${message}` : message;
    }
  }