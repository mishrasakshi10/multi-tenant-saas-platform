
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(formData);
            navigate("/dashboard");
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Invalid username or password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-brand-panel">
                <div className="auth-brand">
                    <div className="auth-logo">P</div>
                    <div>
                        <h2>ProjectHub</h2>
                        <span>WORKSPACE</span>
                    </div>
                </div>

                <div className="auth-brand-content">
                    <span className="auth-eyebrow">
                        PROJECT MANAGEMENT PLATFORM
                    </span>

                    <h1>Everything your team needs, in one place.</h1>

                    <p>
                        Organize your workspaces, manage projects,
                        track tasks and collaborate with your team.
                    </p>

                    <div className="auth-decoration">
                        <div className="auth-decoration-card">
                            <span>✓</span>
                            Manage your projects
                        </div>
                        <div className="auth-decoration-card">
                            <span>✓</span>
                            Collaborate with your team
                        </div>
                        <div className="auth-decoration-card">
                            <span>✓</span>
                            Track your progress
                        </div>
                    </div>
                </div>

                <div className="auth-brand-footer">
                    ProjectHub · SaaS Platform
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-card">

                    <div className="auth-mobile-logo">
                        <div className="auth-logo">P</div>
                        <h2>ProjectHub</h2>
                    </div>

                    <span className="auth-form-tag">WELCOME BACK</span>

                    <h1>Sign in to your account</h1>
                    <p className="auth-description">
                        Enter your credentials to access your workspace.
                    </p>

                    {error && (
                        <div className="auth-alert auth-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="auth-field">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Enter your username"
                                value={formData.username}
                                onChange={handleChange}
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login to Workspace"}
                        </button>

                    </form>

                    <div className="auth-bottom-link">
                        Don't have an account?
                        <Link to="/register"> Create account</Link>
                    </div>

                </div>
            </div>

        </div>
    );
}

export default Login;
