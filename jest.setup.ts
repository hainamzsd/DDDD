/**
 * Jest Setup File
 *
 * This file configures the test environment by:
 * - Mocking AsyncStorage to prevent window/localStorage errors
 * - Suppressing expected console warnings during tests
 */

// Mock AsyncStorage for all tests
// This prevents "window is not defined" errors when testing code that uses AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn((key: string) => Promise.resolve(null)),
  setItem: jest.fn((key: string, value: string) => Promise.resolve()),
  removeItem: jest.fn((key: string) => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Optionally suppress console.error during tests to reduce noise
// You can still see errors when tests fail, but not from expected error handling
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Suppress known AsyncStorage-related errors that are handled gracefully
    const message = args[0]?.toString() || '';
    if (
      message.includes('Failed to get login attempts') ||
      message.includes('Failed to save login attempts') ||
      message.includes('Failed to clear login attempts')
    ) {
      return;
    }
    // For other errors, call original console.error
    originalError(...args);
  });
});

afterAll(() => {
  console.error = originalError;
});
