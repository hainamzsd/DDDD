import { supabase } from './supabase';
import { ObjectType, AdminUnit } from '../types/survey';
import type { Database } from '../types/database';

export const referenceService = {
  /**
   * Get all object types
   */
  async getObjectTypes(): Promise<ObjectType[]> {
    const { data, error } = await supabase
      .from('ref_object_types')
      .select('*')
      .order('sort_order', { ascending: true }) as { data: Database['public']['Tables']['ref_object_types']['Row'][] | null; error: any };

    if (error) throw error;

    return (data || []).map(type => ({
      code: type.code,
      nameVi: type.name_vi,
      description: type.description,
      groupCode: type.group_code,
      sortOrder: type.sort_order,
    }));
  },

  /**
   * Get object types by group
   */
  async getObjectTypesByGroup(groupCode: string): Promise<ObjectType[]> {
    const { data, error } = await supabase
      .from('ref_object_types')
      .select('*')
      .eq('group_code', groupCode)
      .order('sort_order', { ascending: true }) as { data: Database['public']['Tables']['ref_object_types']['Row'][] | null; error: any };

    if (error) throw error;

    return (data || []).map(type => ({
      code: type.code,
      nameVi: type.name_vi,
      description: type.description,
      groupCode: type.group_code,
      sortOrder: type.sort_order,
    }));
  },

  /**
   * Get admin units by level
   */
  async getAdminUnits(level: 'PROVINCE' | 'DISTRICT' | 'WARD', parentCode?: string): Promise<AdminUnit[]> {
    let query = supabase
      .from('ref_admin_units')
      .select('*')
      .eq('level', level);

    if (parentCode) {
      query = query.eq('parent_code', parentCode);
    }

    const { data, error } = await query.order('name', { ascending: true }) as { data: Database['public']['Tables']['ref_admin_units']['Row'][] | null; error: any };

    if (error) throw error;

    return (data || []).map(unit => ({
      code: unit.code,
      name: unit.name,
      level: unit.level,
      parentCode: unit.parent_code,
      fullName: unit.full_name,
      shortName: unit.short_name,
    }));
  },

  /**
   * Get admin unit by code
   */
  async getAdminUnitByCode(code: string): Promise<AdminUnit | null> {
    const { data, error } = await supabase
      .from('ref_admin_units')
      .select('*')
      .eq('code', code)
      .single() as { data: Database['public']['Tables']['ref_admin_units']['Row'] | null; error: any };

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    if (!data) return null;

    return {
      code: data.code,
      name: data.name,
      level: data.level,
      parentCode: data.parent_code,
      fullName: data.full_name,
      shortName: data.short_name,
    };
  },

  /**
   * Get provinces
   */
  async getProvinces(): Promise<AdminUnit[]> {
    return this.getAdminUnits('PROVINCE');
  },

  /**
   * Get districts by province
   */
  async getDistricts(provinceCode: string): Promise<AdminUnit[]> {
    return this.getAdminUnits('DISTRICT', provinceCode);
  },

  /**
   * Get wards by district
   */
  async getWards(districtCode: string): Promise<AdminUnit[]> {
    return this.getAdminUnits('WARD', districtCode);
  },
};

