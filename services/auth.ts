import { supabase } from './supabase';
import { Profile } from '../types/survey';
import { Session } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface AuthUser extends Profile {
  session: Session | null;
}

// Rate limiting configuration
const LOGIN_ATTEMPTS_KEY = '@login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

interface LoginAttempt {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

// Rate limiting helper functions
const getLoginAttempts = async (): Promise<LoginAttempt> => {
  try {
    const data = await AsyncStorage.getItem(LOGIN_ATTEMPTS_KEY);
    return data ? JSON.parse(data) : { count: 0, firstAttemptAt: Date.now() };
  } catch (error) {
    console.error('Failed to get login attempts:', error);
    return { count: 0, firstAttemptAt: Date.now() };
  }
};

const saveLoginAttempts = async (attempts: LoginAttempt): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error('Failed to save login attempts:', error);
  }
};

const clearLoginAttempts = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  } catch (error) {
    console.error('Failed to clear login attempts:', error);
  }
};

const checkRateLimit = async (): Promise<{ allowed: boolean; remainingTime?: number }> => {
  const attempts = await getLoginAttempts();
  const now = Date.now();

  // Check if currently locked out
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000);
    return { allowed: false, remainingTime };
  }

  // Reset attempts if lockout period has expired
  if (attempts.lockedUntil && now >= attempts.lockedUntil) {
    await clearLoginAttempts();
    return { allowed: true };
  }

  // Check if too many attempts within the window
  if (attempts.count >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION;
    await saveLoginAttempts({ ...attempts, lockedUntil });
    return { allowed: false, remainingTime: Math.ceil(LOCKOUT_DURATION / 1000) };
  }

  return { allowed: true };
};

const recordFailedAttempt = async (): Promise<void> => {
  const attempts = await getLoginAttempts();
  const now = Date.now();

  // Reset counter if more than lockout duration has passed since first attempt
  if (now - attempts.firstAttemptAt > LOCKOUT_DURATION) {
    await saveLoginAttempts({ count: 1, firstAttemptAt: now });
  } else {
    await saveLoginAttempts({ ...attempts, count: attempts.count + 1 });
  }
};

export const authService = {
  /**
   * Sign in with ID number (12 digits) and password
   * Uses email format: {idNumber}@police.gov.vn for Supabase Auth
   * Implements rate limiting to prevent brute force attacks (max 5 attempts per 5 minutes)
   */
  async signInWithIdNumber(idNumber: string, password: string) {
    // Check rate limiting
    const rateLimit = await checkRateLimit();
    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.remainingTime || 0) / 60);
      throw new Error(
        `Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau ${minutes} phút.`
      );
    }
    // Validate ID number format (12 digits)
    if (!/^\d{12}$/.test(idNumber)) {
      throw new Error('ID number must be exactly 12 digits');
    }

    // Convert ID number to email format for Supabase Auth
    const email = `${idNumber}@police.gov.vn`;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record failed attempt for rate limiting
        await recordFailedAttempt();

        // Return more user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Mã cán bộ hoặc mật khẩu không đúng');
        }
        throw error;
      }

      // Clear login attempts on successful login
      await clearLoginAttempts();

      // Fetch user profile after successful login
      if (data.user) {
        const profile = await this.getProfile(data.user.id);
        return {
          ...data,
          profile,
        };
      }

      return data;
    } catch (error) {
      // Ensure failed attempts are recorded even on unexpected errors
      if (error instanceof Error && !error.message.includes('Quá nhiều lần đăng nhập')) {
        await recordFailedAttempt();
      }
      throw error;
    }
  },

  /**
   * Sign in with email and password (legacy support)
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Fetch user profile after successful login
    if (data.user) {
      const profile = await this.getProfile(data.user.id);
      return {
        ...data,
        profile,
      };
    }

    return data;
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const profile = await this.getProfile(session.user.id);
    if (!profile) return null;

    return {
      ...profile,
      session,
    };
  },

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single<ProfileRow>();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    const profileData: ProfileRow = data;

    // Map database fields to camelCase
    // Extract ID number from email if available
    const idNumber = profileData.email
      ? profileData.email.replace('@police.gov.vn', '')
      : '';

    return {
      id: profileData.id,
      idNumber,
      fullName: profileData.full_name,
      phoneNumber: profileData.phone_number,
      email: profileData.email,
      role: profileData.role,
      unitCode: profileData.unit_code,
      wardCode: profileData.ward_code,
      districtCode: profileData.district_code,
      provinceCode: profileData.province_code,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
    };
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  },
};

