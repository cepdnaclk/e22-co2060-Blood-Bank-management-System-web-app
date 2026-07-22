import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../utils/swalUtils';
import { useAuth } from '../../context/auth/useAuth';
import './Login.css';

import { getRoleConfig } from '../../config/roleConfig';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login: loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!identifier || !password) {
            setError('Please fill in all fields');
            showWarningToast('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        setLoading(true);

        try {
            const userData = await loginUser(identifier, password);
            const roleConfig = getRoleConfig(userData.role);
            const destination = roleConfig?.dashboard || `/${userData.role || 'donor'}`;

            showSuccessToast(
                'Login Successful!',
                `Welcome back, ${userData.username || identifier.split('@')[0]}.`,
            ).then(() => {
                navigate(destination, { replace: true });
            });
        } catch (error) {
            const message = error.response?.data?.detail || 'Invalid credentials';
            setError(message);
            showErrorToast('Login Failed', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">

                {/* Logo mark */}
                <div className="auth-logo-mark">
                    <div className="logo-icon">🩸</div>
                    <span className="logo-text">HOPEDROP</span>
                </div>

                <div className="auth-header">
                    <h2>Welcome Back</h2>
                </div>

                {error && <div className="auth-error-message">⚠️ {error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login">Email or Username</label>
                        <input
                            type="text"
                            id="login"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            disabled={loading}
                            className={error && !identifier ? 'error-input' : ''}
                            placeholder="Enter email or username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className={error && !password ? 'error-input' : ''}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div className="form-options">
                        <label className="remember-me">
                            <input type="checkbox" />
                            <span>Remember Me</span>
                        </label>
                        <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
                    </div>

                    <button
                        type="submit"
                        className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner"></span> : 'Login'}
                    </button>
                </form>

                <div className="auth-divider"><span>OR</span></div>

                <div className="social-login">
                    <button className="btn-social btn-google" type="button">
                        <span className="social-icon">G</span>
                        Continue with Google
                    </button>
                    <button className="btn-social btn-facebook" type="button">
                        <span className="social-icon">f</span>
                        Continue with Facebook
                    </button>
                </div>

                <div className="auth-footer">
                    <p>Don&apos;t have an account? <Link to="/signup" className="auth-link">Sign Up</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
