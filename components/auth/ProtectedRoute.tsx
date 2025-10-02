
import React from 'react';
// FIX: Corrected named imports from react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import type { Permission } from '../../types';

interface ProtectedRouteProps {
  requiredPermission: Permission;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredPermission }) => {
  const { user } = useAuthStore();
  // Subscribe to the entire permissions object for reactivity.
  // When this object changes in the store, this component will re-render.
  const { permissions } = usePermissionsStore();

  if (!user) {
    return <ReactRouterDOM.Navigate to="/auth/login" replace />;
  }

  const userPermissions = permissions[user.role] || [];
  const hasAccess = userPermissions.includes(requiredPermission);

  if (!hasAccess) {
    // User does not have the required permission, redirect to a forbidden page
    return <ReactRouterDOM.Navigate to="/forbidden" replace />;
  }

  // User is authenticated and has the required permission, render the child routes
  return <ReactRouterDOM.Outlet />;
};

export default ProtectedRoute;