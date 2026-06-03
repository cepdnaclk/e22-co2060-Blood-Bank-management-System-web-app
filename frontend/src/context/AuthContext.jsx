import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import { AuthContext } from './auth/AuthContext';

const normalizeRole = (role) => {
    if (!role) return null;
    const normalized = role.toString().trim().toLowerCase();
    if (normalized === 'blood donor' || normalized === 'blood_donor') return 'donor';
    if (normalized === 'blood camp organizer' || normalized === 'bloodcamp organizer') return 'bloodcamp';
    if (normalized === 'admindashboard') return 'admin';
    if (normalized === 'medicalofficer') return 'medical_officer';
    if (normalized === 'inventory' || normalized === 'inventor') return 'inventor';
    return normalized;
};

const readStoredTokens = () => {
    const storedTokens = localStorage.getItem('authTokens');
    if (!storedTokens) return { tokens: null, user: null };

    try {
        const tokens = JSON.parse(storedTokens);
        if (!tokens?.access) return { tokens: null, user: null };

        const decoded = jwtDecode(tokens.access);

        // Check if the access token is expired
        const now = Date.now() / 1000;
        if (decoded.exp && decoded.exp < now) {
            // Access token is expired — but refresh token might still be valid.
            // We'll let the refresh logic handle it.
            // Still return the user info so we can attempt a refresh.
            return { tokens, user: { ...decoded, role: normalizeRole(decoded?.role) } };
        }

        return { tokens, user: { ...decoded, role: normalizeRole(decoded?.role) } };
    } catch {
        localStorage.removeItem('authTokens');
        return { tokens: null, user: null };
    }
};

export const AuthProvider = ({ children }) => {
    const initialAuth = readStoredTokens();

    const [authTokens, setAuthTokens] = useState(initialAuth.tokens);
    const [user, setUser] = useState(initialAuth.user);
    const [isAuthenticated, setIsAuthenticated] = useState(
        () => Boolean(initialAuth.tokens && initialAuth.user),
    );
    const [loading, setLoading] = useState(false);
    const refreshTimerRef = useRef(null);

    // ────────────────────────────────────────────────────────
    // Token Refresh Logic
    // ────────────────────────────────────────────────────────

    const clearSession = useCallback(() => {
        setIsAuthenticated(false);
        setUser(null);
        setAuthTokens(null);
        localStorage.removeItem('authTokens');
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    const refreshAccessToken = useCallback(async () => {
        const storedTokens = localStorage.getItem('authTokens');
        if (!storedTokens) {
            clearSession();
            return false;
        }

        let tokens;
        try {
            tokens = JSON.parse(storedTokens);
        } catch {
            clearSession();
            return false;
        }

        if (!tokens?.refresh) {
            clearSession();
            return false;
        }

        try {
            const response = await axios.post('http://localhost:8000/api/v1/auth/token/refresh/', {
                refresh: tokens.refresh,
            });

            const newTokens = {
                access: response.data.access,
                // If server rotates refresh tokens, use the new one; otherwise keep the old
                refresh: response.data.refresh || tokens.refresh,
            };

            const decoded = jwtDecode(newTokens.access);
            const userData = { ...decoded, role: normalizeRole(decoded?.role) };

            setAuthTokens(newTokens);
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('authTokens', JSON.stringify(newTokens));

            // Schedule the next refresh
            scheduleRefresh(newTokens.access);

            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            clearSession();
            return false;
        }
    }, [clearSession]);

    // Schedule a refresh 1 minute before the access token expires
    const scheduleRefresh = useCallback((accessToken) => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }

        try {
            const decoded = jwtDecode(accessToken);
            if (!decoded.exp) return;

            const now = Date.now() / 1000;
            // Refresh 60 seconds before expiry
            const refreshIn = (decoded.exp - now - 60) * 1000;

            if (refreshIn <= 0) {
                // Token is already expired or about to expire — refresh now
                refreshAccessToken();
            } else {
                refreshTimerRef.current = setTimeout(() => {
                    refreshAccessToken();
                }, refreshIn);
            }
        } catch {
            // If token can't be decoded, don't schedule
        }
    }, [refreshAccessToken]);

    // On mount: schedule refresh for existing token
    useEffect(() => {
        if (authTokens?.access) {
            const decoded = jwtDecode(authTokens.access);
            const now = Date.now() / 1000;

            if (decoded.exp && decoded.exp < now) {
                // Access token already expired — try refreshing immediately
                refreshAccessToken();
            } else {
                scheduleRefresh(authTokens.access);
            }
        }

        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, []); // Run once on mount

    // ────────────────────────────────────────────────────────
    // Login
    // ────────────────────────────────────────────────────────

    const login = async (identifier, password) => {
        const response = await axios.post('http://localhost:8000/api/v1/auth/token/', {
            email: identifier,
            password,
        });

        const tokens = response.data;
        const decoded = jwtDecode(tokens.access);
        const userData = { ...decoded, role: normalizeRole(decoded?.role) };

        setAuthTokens(tokens);
        setUser(userData);
        setIsAuthenticated(Boolean(tokens && userData));
        localStorage.setItem('authTokens', JSON.stringify(tokens));

        // Schedule auto-refresh
        scheduleRefresh(tokens.access);

        return userData;
    };

    // ────────────────────────────────────────────────────────
    // Logout
    // ────────────────────────────────────────────────────────

    const logout = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You will be logged out of your current session!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#C62828',
            cancelButtonColor: '#637381',
            confirmButtonText: 'Yes, log me out',
        }).then((result) => {
            if (result.isConfirmed) {
                clearSession();

                Swal.fire({
                    title: 'Logged Out!',
                    text: 'You have been successfully logged out.',
                    icon: 'success',
                    confirmButtonColor: '#C62828',
                    timer: 1500,
                });
            }
        });
    };

    const value = {
        isAuthenticated,
        user,
        role: user?.role || null,
        authTokens,
        setAuthTokens,
        setUser,
        login,
        logout,
        loading,
        refreshAccessToken,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
