/**
 * FleetFlow RBAC Permissions Matrix
 * ─────────────────────────────────
 * Roles: manager, dispatcher, safety_officer, analyst, driver
 * Access levels: full, view_edit, view, none
 *
 * Module        | Manager          | Dispatcher | Safety Officer | Analyst   | Driver
 * ──────────────|──────────────────|────────────|────────────────|───────────|────────
 * Dashboard     | Full Access      | View Only  | View Only      | View Only | View Only
 * My Trips      | No Access        | No Access  | No Access      | No Access | Full
 * Drivers       | Full Access      | Full Access| View/Edit      | No Access | No Access
 * Vehicles      | Full Access      | View Only  | View Only      | No Access | No Access
 * Trips         | Full Access      | Full Access| View Only      | View Only | No Access
 * Expenses      | Full Access      | View Only  | No Access      | View Only | No Access
 * Maintenance   | Full Access      | View Only  | View Only      | View Only | No Access
 * Analytics     | Full Access      | View Only  | View Only      | Full      | No Access
 * Users         | Full (RBAC)      | No Access  | No Access      | No Access | No Access
 */

const PERMISSIONS = {
    drivers: {
        manager: 'full',
        dispatcher: 'full',
        safety_officer: 'view_edit',
        analyst: 'none',
        driver: 'none',
    },
    vehicles: {
        manager: 'full',
        dispatcher: 'view',
        safety_officer: 'view',
        analyst: 'none',
        driver: 'none',
    },
    trips: {
        manager: 'full',
        dispatcher: 'full',
        safety_officer: 'view',
        analyst: 'view',
        driver: 'none',
    },
    expenses: {
        manager: 'full',
        dispatcher: 'view',
        safety_officer: 'none',
        analyst: 'view',
        driver: 'none',
    },
    maintenance: {
        manager: 'full',
        dispatcher: 'view',
        safety_officer: 'view',
        analyst: 'view',
        driver: 'none',
    },
    analytics: {
        manager: 'full',
        dispatcher: 'view',
        safety_officer: 'view',
        analyst: 'full',
        driver: 'none',
    },
    users: {
        manager: 'full',
        dispatcher: 'none',
        safety_officer: 'none',
        analyst: 'none',
        driver: 'none',
    },
    dashboard: {
        manager: 'full',
        dispatcher: 'view',
        safety_officer: 'view',
        analyst: 'view',
        driver: 'view',
    },
    mytrips: {
        manager: 'none',
        dispatcher: 'none',
        safety_officer: 'none',
        analyst: 'none',
        driver: 'full',
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
