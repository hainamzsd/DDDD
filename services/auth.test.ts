/**
 * Integration tests for auth service
 * Tests Supabase Auth integration with mock responses
 */

import { authService } from './auth';
import { supabase } from './supabase';

// Mock the supabase client
jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithIdNumber', () => {
    it('should successfully sign in with valid 12-digit ID number', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: '123456789012@police.gov.vn',
        },
      };

      const mockProfile = {
        id: 'user-123',
        full_name: 'Nguyễn Văn A',
        phone_number: '0912345678',
        unit_code: 'CAXTEST',
        ward_code: '00001',
        district_code: '001',
        province_code: '01',
        role: 'officer',
        email: '123456789012@police.gov.vn',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock signInWithPassword
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: {
          user: mockSession.user,
          session: mockSession,
        },
        error: null,
      });

      // Mock profile fetch
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const result = await authService.signInWithIdNumber('123456789012', 'Test@123456');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: '123456789012@police.gov.vn',
        password: 'Test@123456',
      });
      expect(result).toHaveProperty('profile');
      if ('profile' in result && result.profile) {
        expect(result.profile.idNumber).toBe('123456789012');
        expect(result.profile.fullName).toBe('Nguyễn Văn A');
      }
    });

    it('should throw error for invalid ID number format (not 12 digits)', async () => {
      await expect(
        authService.signInWithIdNumber('12345', 'password')
      ).rejects.toThrow('ID number must be exactly 12 digits');

      await expect(
        authService.signInWithIdNumber('123456789', 'password')
      ).rejects.toThrow('ID number must be exactly 12 digits');

      await expect(
        authService.signInWithIdNumber('12345678901234', 'password')
      ).rejects.toThrow('ID number must be exactly 12 digits');
    });

    it('should throw error for non-numeric ID number', async () => {
      await expect(
        authService.signInWithIdNumber('12345678901a', 'password')
      ).rejects.toThrow('ID number must be exactly 12 digits');
    });

    it('should return Vietnamese error message for invalid credentials', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      await expect(
        authService.signInWithIdNumber('123456789012', 'wrongpassword')
      ).rejects.toThrow('Mã cán bộ hoặc mật khẩu không đúng');
    });

    it('should propagate other Supabase errors', async () => {
      const mockError = new Error('Network error');
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(
        authService.signInWithIdNumber('123456789012', 'password')
      ).rejects.toThrow('Network error');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      await authService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error if sign out fails', async () => {
      const mockError = new Error('Sign out failed');
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getProfile', () => {
    it('should fetch and map profile data correctly', async () => {
      const mockProfileRow = {
        id: 'user-123',
        full_name: 'Nguyễn Văn A',
        phone_number: '0912345678',
        unit_code: 'CAXTEST',
        ward_code: '00001',
        district_code: '001',
        province_code: '01',
        role: 'officer',
        email: '123456789012@police.gov.vn',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileRow,
              error: null,
            }),
          }),
        }),
      });

      const profile = await authService.getProfile('user-123');

      expect(profile).toBeDefined();
      if (profile) {
        expect(profile.id).toBe('user-123');
        expect(profile.idNumber).toBe('123456789012');
        expect(profile.fullName).toBe('Nguyễn Văn A');
        expect(profile.phoneNumber).toBe('0912345678');
        expect(profile.unitCode).toBe('CAXTEST');
      }
    });

    it('should extract ID number from email correctly', async () => {
      const mockProfileRow = {
        id: 'user-456',
        full_name: 'Trần Thị B',
        email: '987654321098@police.gov.vn',
        phone_number: null,
        unit_code: 'CAXTEST2',
        ward_code: '00002',
        district_code: '002',
        province_code: '02',
        role: 'officer',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileRow,
              error: null,
            }),
          }),
        }),
      });

      const profile = await authService.getProfile('user-456');

      expect(profile).toBeDefined();
      if (profile) {
        expect(profile.idNumber).toBe('987654321098');
      }
    });

    it('should handle missing email gracefully', async () => {
      const mockProfileRow = {
        id: 'user-789',
        full_name: 'Lê Văn C',
        email: null,
        phone_number: '0987654321',
        unit_code: 'CAXTEST3',
        ward_code: '00003',
        district_code: '003',
        province_code: '03',
        role: 'officer',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileRow,
              error: null,
            }),
          }),
        }),
      });

      const profile = await authService.getProfile('user-789');

      expect(profile).toBeDefined();
      if (profile) {
        expect(profile.idNumber).toBe('');
      }
    });

    it('should return null if profile not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found' },
            }),
          }),
        }),
      });

      const profile = await authService.getProfile('nonexistent-user');
      expect(profile).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should return current session if exists', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: '123456789012@police.gov.vn',
        },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const session = await authService.getSession();

      expect(session).toEqual(mockSession);
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it('should return null if no session exists', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await authService.getSession();

      expect(session).toBeNull();
    });

    it('should throw error if session check fails', async () => {
      const mockError = new Error('Session check failed');
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      await expect(authService.getSession()).rejects.toThrow(
        'Session check failed'
      );
    });
  });
});
