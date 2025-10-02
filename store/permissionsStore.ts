


import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserRole, Permission } from '../types';

interface PermissionsState {
  permissions: Record<UserRole, Permission[]>;
  setRolePermissions: (role: UserRole, permissions: Permission[]) => void;
}

const defaultPermissions: Record<UserRole, Permission[]> = {
  admin: [
    'view_all_submissions',
    'manage_users',
    'manage_sites',
    'view_entity_management',
    'view_developer_settings',
    'view_operations_dashboard',
    'view_site_dashboard',
    'create_enrollment',
    'manage_roles_and_permissions',
    'manage_attendance_rules',
    'view_all_attendance',
    'view_own_attendance',
    'apply_for_leave',
    'manage_leave_requests',
    'manage_approval_workflow',
    'download_attendance_report',
    'manage_tasks',
    'manage_policies',
    'manage_insurance',
    'manage_enrollment_rules',
    'manage_uniforms',
    'view_invoice_summary',
    'view_field_officer_tracking',
  ],
  hr: [
    'view_all_submissions',
    'manage_users',
    'manage_sites',
    'view_entity_management',
    'manage_attendance_rules',
    'view_all_attendance',
    'view_own_attendance',
    'apply_for_leave',
    'manage_leave_requests',
    'download_attendance_report',
    'manage_policies',
    'manage_insurance',
    'manage_enrollment_rules',
    'manage_uniforms',
    'view_invoice_summary',
    'view_field_officer_tracking',
  ],
  developer: ['view_developer_settings'],
  operation_manager: ['view_operations_dashboard', 'view_all_attendance', 'apply_for_leave', 'manage_leave_requests', 'manage_tasks'],
  site_manager: ['view_site_dashboard', 'create_enrollment', 'view_own_attendance', 'apply_for_leave'],
  field_officer: ['create_enrollment', 'view_own_attendance', 'apply_for_leave'],
};

export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set) => ({
      permissions: defaultPermissions,
      setRolePermissions: (role, newPermissions) => {
        set((state) => ({
          permissions: {
            ...state.permissions,
            [role]: newPermissions,
          },
        }));
      },
    }),
    {
      name: 'paradigm_app_permissions',
      storage: createJSONStorage(() => localStorage),
    }
  )
);