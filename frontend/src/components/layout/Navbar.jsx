import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Activity, User, ShieldAlert, LogIn, LogOut, Mail, Calendar, ClipboardList, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/auth/useAuth';
import { getRoleConfig, PUBLIC_NAV_ITEMS, ICON_MAP } from '../../config/roleConfig';
import './Navbar.css';
import { LOGOS } from '../../config/imageAssets';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, role, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // ─── Build nav items based on role ───
    const roleConfig = isAuthenticated ? getRoleConfig(role) : null;
    const roleNavItems = roleConfig ? roleConfig.navItems : [];

    // Highlight active link
    const navLinkClass = (path) =>
        `nav-link ${location.pathname === path ? 'active' : ''}`;

    const sidebarLinkClass = (path) =>
        `sidebar-link ${location.pathname === path ? 'active' : ''}`;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    //handle home click: if already on home, scroll to top and refresh data; otherwise, just navigate
    const handleHomeClick = (e) => {
        if (location.pathname === '/') {
            e.preventDefault();
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Force a reload to refresh data and come to top
            window.location.reload(); 
        }
        closeMenu();
    };

    // ─── Scroll detection ───
    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 50);
            if (window.scrollY > 50) {
                document.body.classList.add('scrolled');
            } else {
                document.body.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });

        // Initial check in case loaded scrolled down
        onScroll();

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ─── Toggle sidebar menu ───
    const toggleMenu = () => {
        setMenuOpen(prev => !prev);
        document.body.classList.toggle('menu-open');
    };

    const closeMenu = () => {
        setMenuOpen(false);
        document.body.classList.remove('menu-open');
    };

    /** Render a nav icon by its string name from roleConfig */
    const renderIcon = (iconName, size = 16) => {
        const IconComponent = ICON_MAP[iconName];
        return IconComponent ? <IconComponent size={size} /> : null;
    };

    const isHomePage = location.pathname === '/';

    // ─── Get current page name for mobile menu ───
    const getCurrentPageName = () => {
        const publicMatch = PUBLIC_NAV_ITEMS.find(item => item.path === location.pathname);
        if (publicMatch) return publicMatch.label;
        
        if (isAuthenticated && roleNavItems) {
            const roleMatch = roleNavItems.find(item => item.path === location.pathname);
            if (roleMatch) return roleMatch.label;
        }
        
        // Fallbacks for nested routes
        if (location.pathname.includes('/dashboard')) return 'Dashboard';
        if (location.pathname.includes('/profile')) return 'Profile';
        if (location.pathname === '/') return 'Home';
        return '';
    };
    const currentPageName = getCurrentPageName();

    return (
        <>
            {/* ==================== MAIN NAVIGATION ==================== */}
            <nav className={`nav ${scrolled ? 'scrolled' : ''} ${isHomePage ? 'on-home' : ''}`} id="nav">

                {/* LOGO (left side) */}
                <Link to="/" className="nav-logo nav-logo-home" onClick={handleHomeClick}>
                    <img src={LOGOS.icon} alt="HOPEDROP Logo" className="nav-logo-img" />
                    <span className="logo-text">HOPEDROP</span>
                </Link>

                {/* DESKTOP LINKS (center — hidden below 1024px) */}
                <div className="nav-links">
                    {/* Public links (always visible) */}
                    {PUBLIC_NAV_ITEMS.map((item) => (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className={`${navLinkClass(item.path)} nav-link-home`}
                            onClick={item.path === '/' ? handleHomeClick : closeMenu}
                        >
                            {item.icon && renderIcon(item.icon)}
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    {/* Role-specific links (only when logged in) */}
                    {isAuthenticated && roleNavItems.map((item) => (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className={`${navLinkClass(item.path)} nav-link-home`}
                            onClick={item.path === '/' ? handleHomeClick : closeMenu}
                        >
                            {renderIcon(item.icon)}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>

                {/* ACTIONS (right side) */}
                <div className="nav-actions">


                    {/* Desktop Auth Button (Hidden on Mobile) */}
                    <div className="desktop-actions-only">
                        {isAuthenticated ? (
                            <button className="nav-cta" onClick={handleLogout}>
                                <LogOut size={16} />
                                <span className="cta-text">Logout</span>
                            </button>
                        ) : (
                            <Link to="/login" className="nav-cta">
                                <LogIn size={16} />
                                <span className="cta-text">Login</span>
                            </Link>
                        )}
                    </div>

                    {/* HAMBURGER TOGGLE (visible below 1024px) */}
                    <button
                        className={`nav-menu-toggle ${menuOpen ? 'active' : ''}`}
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        <span className="menu-line"></span>
                        <span className="menu-line"></span>
                        <span className="menu-line"></span>
                    </button>
                </div>
            </nav>

            {/* ==================== GLASSMORPHIC SIDEBAR (MOBILE) ==================== */}
            <div className={`sidebar-overlay ${menuOpen ? 'active' : ''}`} onClick={closeMenu}></div>
            <aside className={`glass-sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="nav-logo" onClick={handleHomeClick}>
                        <img src={LOGOS.icon} alt="HOPEDROP Logo" className="nav-logo-img" />
                        <span className="logo-text">HOPEDROP</span>
                    </Link>
                    <button className="sidebar-close-btn" onClick={closeMenu} aria-label="Close Menu">
                        &times;
                    </button>
                </div>

                {currentPageName && (
                    <div className="sidebar-current-page">
                        <span className="current-label">You are here:</span>
                        <div className="current-page-name">{currentPageName}</div>
                    </div>
                )}

                <div className="sidebar-content">
                    {/* Public links */}
                    {PUBLIC_NAV_ITEMS.map((item) => (
                        <Link 
                            key={`side-${item.path}`} 
                            to={item.path} 
                            className={sidebarLinkClass(item.path)} 
                            onClick={item.path === '/' ? handleHomeClick : closeMenu}
                        >
                            <div className="sidebar-icon-wrapper">{renderIcon(item.icon, 20)}</div>
                            <span className="sidebar-label">{item.label}</span>
                        </Link>
                    ))}

                    {/* Role-specific links */}
                    {isAuthenticated && roleNavItems.map((item) => (
                        <Link 
                            key={`side-${item.path}`} 
                            to={item.path} 
                            className={sidebarLinkClass(item.path)} 
                            onClick={item.path === '/' ? handleHomeClick : closeMenu}
                        >
                            <div className="sidebar-icon-wrapper">{renderIcon(item.icon, 20)}</div>
                            <span className="sidebar-label">{item.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="sidebar-footer">

                    {isAuthenticated ? (
                        <button className="sidebar-auth-btn log-out" onClick={() => { handleLogout(); closeMenu(); }}>
                            <LogOut size={18} /> <span>Logout</span>
                        </button>
                    ) : (
                        <Link to="/login" className="sidebar-auth-btn log-in" onClick={closeMenu}>
                            <LogIn size={18} /> <span>Login</span>
                        </Link>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Navbar;
