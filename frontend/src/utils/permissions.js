/**
 * FleetFlow RBAC Permissions Matrix
 * ─────────────────────────────────
 * Roles: manager, dispatcher, safety_officer, analyst
 * Access levels: full, view_edit, view, none
 *
 * Module        | Manager          | Dispatcher | Safety Officer | Analyst
 * ──────────────|──────────────────|────────────|────────────────|─────────
 * Drivers       | Full Access      | View Only  | View/Edit      | No Access
 * Vehicles      | Full Access      | View Only  | View Only      | No Access
 * Trips         | Full Access      | Full Access| View Only      | View Only
 * Expenses      | Full Access      | View Only  | No Access      | View Only
 * Maintenance   | Full Access      | View Only  | View Only      | View Only
 * Analytics     | Full Access      | View Only  | View Only      | Full Access
 * Users         | Full (RBAC)      | No Access  | No Access      | No Access
 */

const PERMISSIONS = {
    drivers: {
        manager: 'full',
        dispatcher: 'view',
        safety_officer: 'view_edit',
        analyst: 'none',
    },
    vehicles: {
        manager: 'full',
        dispatcher: 'view',
        safety_officer: 'view',
        analyst: 'none',
    },
    trips: {
        manager: 'full',
        dispatcher: 'full',
        safety_officer: 'view',
        analyst: 'view',
    },
    expenses: {
        manager: 'full',
        dispatcher: 'view',
        safety_officer: 'none',
        analyst: 'view',
    },
    maintenance: {
        manager: 'full',
        dispatcher: 'view',
        safety_officer: 'view',
        analyst: 'view',
    },
    analytics: {
        manager: 'full',
        dispatcher: 'view',
        safety_officer: 'view',
        analyst: 'full',
    },
    users: {
        manager: 'full',
        dispatcher: 'none',
        safety_officer: 'none',
        analyst: 'none',
    },
    dashboard: {
        manager: 'full',
        dispatcher: 'view',
        safety_officer: 'view',
        analyst: 'view',
    },
};

/**
 * Get the access level for a module and role.
 * @param {string} module - Module name (e.g., 'drivers', 'vehicles')
 * @param {string} role   - User role (e.g., 'manager', 'dispatcher')
 * @returns {'full'|'view_edit'|'view'|'none'}
 */
export function getAccessLevel(module, role) {
    return PERMISSIONS[module]?.[role] || 'none';
}

/**
 * Check if the user has at least "view" access to a module.
 */
export function canView(module, role) {
    const level = getAccessLevel(module, role);
    return level !== 'none';
}

/**
 * Check if the user can edit (create/update) in a module.
 * Allowed for 'full' and 'view_edit' access levels.
 */
export function canEdit(module, role) {
    const level = getAccessLevel(module, role);
    return level === 'full' || level === 'view_edit';
}

/**
 * Check if the user can delete in a module.
 * Only 'full' access allows deletion.
 */
export function canDelete(module, role) {
    const level = getAccessLevel(module, role);
    return level === 'full';
}

/**
 * Check if the user can create (add new records) in a module.
 * Only 'full' access allows creation.
 */
export function canCreate(module, role) {
    const level = getAccessLevel(module, role);
    return level === 'full';
}

/**
 * Get all visible sidebar modules for a role.
 * Returns module names where the role has at least 'view' access.
 */
export function getVisibleModules(role) {
    return Object.keys(PERMISSIONS).filter(mod => canView(mod, role));
}

export default PERMISSIONS;
