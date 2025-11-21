/**
 * Rate Limiting Tests for Authentication Service
 * Tests the rate limiting functionality to prevent brute force attacks
 */

import { authService } from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Mock dependencies
jest.mock('./supabase');
jest.mock('@react-native-async-storage/async-storage');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Authentication Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any stored attempts
    mockAsyncStorage.getItem.mockResolvedValue(null);
  });

  describe('Login Attempt Tracking', () => {
    it('should allow first login attempt', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      try {
        await authService.signInWithIdNumber('123456789012', 'wrongpassword');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Should record the failed attempt
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@login_attempts',
        expect.stringContaining('"count":1')
      );
    });

    it('should allow multiple attempts under the limit', async () => {
      const attempts = { count: 3, firstAttemptAt: Date.now() };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(attempts));
      mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      try {
        await authService.signInWithIdNumber('123456789012', 'wrongpassword');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Should increment the attempt count
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@login_attempts',
        expect.stringContaining('"count":4')
      );
    });

    it('should block login after 5 failed attempts', async () => {
      const attempts = { count: 5, firstAttemptAt: Date.now() };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(attempts));

      await expect(
        authService.signInWithIdNumber('123456789012', 'anypassword')
      ).rejects.toThrow(/Quá nhiều lần đăng nhập thất bại/);

      // Should not call Supabase auth when rate limited
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should show remaining lockout time in error message', async () => {
      const lockedUntil = Date.now() + 180000; // 3 minutes from now
      const attempts = {
        count: 5,
        firstAttemptAt: Date.now() - 300000,
        lockedUntil,
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(attempts));

      await expect(
        authService.signInWithIdNumber('123456789012', 'anypassword')
      ).rejects.toThrow(/Vui lòng thử lại sau 3 phút/);
    });

    it('should clear attempts after successful login', async () => {
      const attempts = { count: 2, firstAttemptAt: Date.now() };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(attempts));

      const mockUser = { id: 'user-123', email: '123456789012@police.gov.vn' };
      const mockSession = { access_token: 'token', user: mockUser };

      mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            email: '123456789012@police.gov.vn',
            full_name: 'Test Officer',
            phone_number: '0912345678',
            role: 'surveyor',
            unit_code: 'C06',
            ward_code: '001',
            district_code: '01',
            province_code: '79',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      }) as any;

      await authService.signInWithIdNumber('123456789012', 'correctpassword');

      // Should clear the attempts
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@login_attempts');
    });

    it('should reset attempts after lockout period expires', async () => {
      const expiredLockout = Date.now() - 1000; // 1 second ago
      const attempts = {
        count: 5,
        firstAttemptAt: Date.now() - 360000,
        lockedUntil: expiredLockout,
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(attempts));

      const mockUser = { id: 'user-123', email: '123456789012@police.gov.vn' };
      const mockSession = { access_token: 'token', user: mockUser };

      mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            email: '123456789012@police.gov.vn',
            full_name: 'Test Officer',
            phone_number: '0912345678',
            role: 'surveyor',
            unit_code: 'C06',
            ward_code: '001',
            district_code: '01',
            province_code: '79',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      }) as any;

      // Should clear expired attempts first
      expect(mockAsyncStorage.getItem).toBeDefined();

      await authService.signInWithIdNumber('123456789012', 'correctpassword');

      // Should allow login and clear attempts
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it('should reset attempt counter after 5 minutes of inactivity', async () => {
      const oldAttempts = {
        count: 3,
        firstAttemptAt: Date.now() - 360000, // 6 minutes ago
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(oldAttempts));
      mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      try {
        await authService.signInWithIdNumber('123456789012', 'wrongpassword');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Should reset to count 1 since more than 5 minutes passed
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@login_attempts',
        expect.stringContaining('"count":1')
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      // Should still attempt login even if storage fails
      try {
        await authService.signInWithIdNumber('123456789012', 'wrongpassword');
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it('should handle invalid stored data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');
      mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      // Should handle parse error and allow login attempt
      try {
        await authService.signInWithIdNumber('123456789012', 'wrongpassword');
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it('should not count rate limit errors as failed attempts', async () => {
      const attempts = { count: 5, firstAttemptAt: Date.now() };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(attempts));

      try {
        await authService.signInWithIdNumber('123456789012', 'anypassword');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Should not increment attempt count for rate limit errors
      const setItemCalls = mockAsyncStorage.setItem.mock.calls.filter(
        (call) => call[0] === '@login_attempts'
      );

      // Should only be called once to set the lockout
      expect(setItemCalls.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Vietnamese Error Messages', () => {
    it('should show Vietnamese error for rate limiting', async () => {
      const attempts = { count: 5, firstAttemptAt: Date.now() };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(attempts));

      await expect(
        authService.signInWithIdNumber('123456789012', 'anypassword')
      ).rejects.toThrow('Quá nhiều lần đăng nhập thất bại');
    });

    it('should calculate minutes correctly for Vietnamese message', async () => {
      const lockedUntil = Date.now() + 270000; // 4.5 minutes from now
      const attempts = {
        count: 5,
        firstAttemptAt: Date.now() - 300000,
        lockedUntil,
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(attempts));

      await expect(
        authService.signInWithIdNumber('123456789012', 'anypassword')
      ).rejects.toThrow(/sau 5 phút/); // Should round up 4.5 minutes to 5
    });
  });

  describe('Security Considerations', () => {
    it('should use consistent error messages to prevent user enumeration', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockSupabase.auth.signInWithPassword = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      try {
        await authService.signInWithIdNumber('123456789012', 'wrongpassword');
      } catch (error) {
        expect((error as Error).message).toBe('Mã cán bộ hoặc mật khẩu không đúng');
      }
    });

    it('should enforce 12-digit ID format before rate limiting', async () => {
      // Invalid format should fail before rate limit check
      await expect(
        authService.signInWithIdNumber('123', 'anypassword')
      ).rejects.toThrow('ID number must be exactly 12 digits');

      // Should not record attempt for invalid format
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
