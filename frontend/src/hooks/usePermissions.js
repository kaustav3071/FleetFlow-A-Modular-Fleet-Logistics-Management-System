import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { canView, canEdit, canCreate, canDelete, getAccessLevel } from '../utils/permissions.js';

/**
 * Custom hook for checking RBAC permissions in any component.
 *
 * Usage:
 *   const { can } = usePermissions('vehicles');
 *   if (can.create) showAddButton();
 *   if (can.edit) showEditButton();
 *   if (can.delete) showDeleteButton();
 *   if (can.view) showPage();
 */
export function usePermissions(module) {
    const { user } = useAuth();
    const role = user?.role || '';

    const can = useMemo(() => ({
        view: canView(module, role),
        edit: canEdit(module, role),
        create: canCreate(module, role),
        delete: canDelete(module, role),
        level: getAccessLevel(module, role),
    }), [module, role]);

    return { can, role, user };
}

export default usePermissions;
