import { supabase } from './supabase';
import { Profile } from '../types/survey';
import { Session } from '@supabase/supabase-js';
import { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface AuthUser extends Profile {
  session: Session | null;
}

export const authService = {
  /**
   * Sign in with ID number (12 digits) and password
   * Uses email format: {idNumber}@police.gov.vn for Supabase Auth
   */
  async signInWithIdNumber(idNumber: string, password: string) {
    // Validate ID number format (12 digits)
    if (!/^\d{12}$/.test(idNumber)) {
      throw new Error('ID number must be exactly 12 digits');
    }

    // Convert ID number to email format for Supabase Auth
    const email = `${idNumber}@police.gov.vn`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Return more user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Mã cán bộ hoặc mật khẩu không đúng');
      }
      throw error;
    }

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

