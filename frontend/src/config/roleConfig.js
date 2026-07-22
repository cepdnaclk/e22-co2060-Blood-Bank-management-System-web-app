/**
 * ─── HOPEDROP Role Configuration ───────────────────────────────────
 * Centralized config for role-based navigation and route access.
 * Each role defines:
 *   • dashboard  – redirect path after login
 *   • allowedRoutes – route prefixes this role may access
 *   • navItems  – links shown in the navbar for this role
 * ────────────────────────────────────────────────────────────────────
 */

import {
    ShieldAlert,
    Activity,
    User,
    Calendar,
    ClipboardList,
    Home,
    Mail,
    Info,
    Settings
} from 'lucide-react';

/* ── Icon lookup (used by Navbar to render the correct icon) ── */
export const ICON_MAP = {
    ShieldAlert,
    Activity,
    User,
    Calendar,
    ClipboardList,
    Home,
    Mail,
    Info,
    Settings
};

/* ── Role definitions ── */
const ROLE_CONFIG = {
    admin: {
        label: 'System Administrator',
        dashboard: '/admin',
        allowedRoutes: ['/admin', '/staff', '/doctor', '/donor', '/patient', '/events'],
        navItems: [
            { path: '/doctor',  label: 'Medical',  icon: 'Activity' },
            { path: '/staff',   label: 'Lab',      icon: 'ClipboardList' },
            { path: '/donor',   label: 'Donor',    icon: 'User' },
        ],
    },

    medical_officer: {
        label: 'Medical Officer',
        dashboard: '/doctor',
        allowedRoutes: ['/doctor', '/patient', '/events'],
        navItems: [
            { path: '/doctor',  label: 'Medical',  icon: 'Activity' },
        ],
    },

    doctor: {
        label: 'Doctor',
        dashboard: '/doctor',
        allowedRoutes: ['/doctor',  '/events'],
        navItems: [
            { path: '/doctor',  label: 'Medical',  icon: 'Activity' },
        ],
    },

    donor: {
        label: 'Blood Donor',
        dashboard: '/donor',
        allowedRoutes: ['/donor', '/events'],
        navItems: [
            { path: '/donor',   label: 'Donor',  icon: 'User' },
        ],
    },

    bloodcamp: {
        label: 'Blood Camp Organizer',
        dashboard: '/bloodcamp',
        allowedRoutes: ['/bloodcamp', '/staff', '/events'],
        navItems: [
            { path: '/bloodcamp', label: 'Camp', icon: 'Calendar' },
            { path: '/staff', label: 'Lab', icon: 'ClipboardList' },
        ],
    },

    inventor: {
        label: 'Inventory Officer',
        dashboard: '/inventory',
        allowedRoutes: ['/inventory', '/events'],
        navItems: [
            { path: '/inventory', label: 'Inventory', icon: 'ClipboardList' },
        ],
    },
};

/* ── Public pages visible to ALL users (logged-in or not) ── */
export const PUBLIC_NAV_ITEMS = [
    { path: '/',   label: 'Home',   icon: 'Home' },
    { path: '/events',  label: 'Events', icon: 'Calendar' },
    { path: '/contact',   label: 'Contact',   icon: 'Mail' },
    { path: '/about-us',  label: 'About Us',  icon: 'Info' },
    { path: '/services',  label: 'Services',  icon: 'Settings' },
];

/* ── Public routes that don't need auth ── */
export const PUBLIC_ROUTES = ['/', '/login', '/signup', '/contact', '/events', '/about-us', '/services', '/unauthorized'];

/* ── Role options for the signup form ── */
export const ROLE_OPTIONS = [
    { value: 'donor', label: 'Donor' },
];

/**
 * Get the config for a given role.
 * Falls back to 'donor' if role is unknown.
 */
export const getRoleConfig = (role) => {
    return ROLE_CONFIG[role] || ROLE_CONFIG.donor;
};

/**
 * Check whether a given role is allowed to access a path.
 */
export const isRouteAllowed = (role, path) => {
    if (PUBLIC_ROUTES.includes(path)) return true;
    const config = getRoleConfig(role);
    return config.allowedRoutes.some((prefix) => path.startsWith(prefix));
};

export default ROLE_CONFIG;
