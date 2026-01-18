import { StateHelpers } from './state.';

describe('StateHelpers', () => {
  describe('hasData', () => {
    it('should return true when not loading, no error, and data exists', () => {
      expect(StateHelpers.hasData(false, null, 5)).toBe(true);
    });

    it('should return false when loading', () => {
      expect(StateHelpers.hasData(true, null, 5)).toBe(false);
    });

    it('should return false when there is an error', () => {
      expect(StateHelpers.hasData(false, 'Error occurred', 5)).toBe(false);
    });

    it('should return false when data length is 0', () => {
      expect(StateHelpers.hasData(false, null, 0)).toBe(false);
    });

    it('should return false when data length is negative', () => {
      expect(StateHelpers.hasData(false, null, -1)).toBe(false);
    });

    it('should return false when loading and has error', () => {
      expect(StateHelpers.hasData(true, 'Error', 5)).toBe(false);
    });

    it('should return false when all conditions are negative', () => {
      expect(StateHelpers.hasData(true, 'Error', 0)).toBe(false);
    });
  });

  describe('showNoData', () => {
    it('should return true when not loading, no error, and data is empty', () => {
      expect(StateHelpers.showNoData(false, null, 0)).toBe(true);
    });

    it('should return false when loading', () => {
      expect(StateHelpers.showNoData(true, null, 0)).toBe(false);
    });

    it('should return false when there is an error', () => {
      expect(StateHelpers.showNoData(false, 'Error occurred', 0)).toBe(false);
    });

    it('should return false when data exists', () => {
      expect(StateHelpers.showNoData(false, null, 5)).toBe(false);
    });

    it('should return false when loading and has error', () => {
      expect(StateHelpers.showNoData(true, 'Error', 0)).toBe(false);
    });

    it('should return false when data exists even with positive length', () => {
      expect(StateHelpers.showNoData(false, null, 1)).toBe(false);
    });
  });

  describe('extractErrorMessage', () => {
    it('should extract message from error.error.message', () => {
      const err = {
        error: { message: 'API error' }
      };
      expect(StateHelpers.extractErrorMessage(err)).toBe('API error');
    });

    it('should extract message from error.message', () => {
      const err = {
        message: 'Network error'
      };
      expect(StateHelpers.extractErrorMessage(err)).toBe('Network error');
    });

    it('should return "Unknown error" for empty error object', () => {
      const err = {};
      expect(StateHelpers.extractErrorMessage(err)).toBe('Unknown error');
    });

    it('should add prefix when provided', () => {
      const err = {
        error: { message: 'API error' }
      };
      expect(StateHelpers.extractErrorMessage(err, 'Failed to load'))
        .toBe('Failed to load: API error');
    });

    it('should not add prefix when not provided', () => {
      const err = {
        error: { message: 'API error' }
      };
      expect(StateHelpers.extractErrorMessage(err)).toBe('API error');
    });

    it('should handle null error', () => {
      expect(StateHelpers.extractErrorMessage(null)).toBe('Unknown error');
    });

    it('should handle undefined error', () => {
      expect(StateHelpers.extractErrorMessage(undefined)).toBe('Unknown error');
    });

    it('should prioritize error.error.message over error.message', () => {
      const err = {
        error: { message: 'Detailed error' },
        message: 'Generic error'
      };
      expect(StateHelpers.extractErrorMessage(err)).toBe('Detailed error');
    });

    it('should handle empty string message', () => {
      const err = {
        error: { message: '' }
      };
      // Empty string is falsy, so should fall back to error.message or 'Unknown error'
      expect(StateHelpers.extractErrorMessage(err)).toBe('Unknown error');
    });

    it('should handle complex error objects', () => {
      const err = {
        error: {
          message: 'Validation failed',
          statusCode: 400,
          details: ['Field required']
        }
      };
      expect(StateHelpers.extractErrorMessage(err, 'Form error'))
        .toBe('Form error: Validation failed');
    });
  });

  describe('Edge Cases', () => {
    it('hasData and showNoData should be mutually exclusive when conditions are clear', () => {
      // Both false when loading
      expect(StateHelpers.hasData(true, null, 5)).toBe(false);
      expect(StateHelpers.showNoData(true, null, 0)).toBe(false);

      // Both false when error exists
      expect(StateHelpers.hasData(false, 'Error', 5)).toBe(false);
      expect(StateHelpers.showNoData(false, 'Error', 0)).toBe(false);

      // hasData true, showNoData false when data exists
      expect(StateHelpers.hasData(false, null, 5)).toBe(true);
      expect(StateHelpers.showNoData(false, null, 5)).toBe(false);

      // hasData false, showNoData true when no data
      expect(StateHelpers.hasData(false, null, 0)).toBe(false);
      expect(StateHelpers.showNoData(false, null, 0)).toBe(true);
    });
  });
});
