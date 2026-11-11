
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        password2: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
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
        setSuccess("");

        if (formData.password !== formData.password2) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await register(formData);
            setSuccess("Registration successful! Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (err) {
            const data = err.response?.data;

            if (data && typeof data === "object") {
                const firstError = Object.values(data).flat()[0];
                setError(firstError || "Registration failed.");
            } else {
                setError("Unable to register. Please try again.");
            }
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
                        START YOUR JOURNEY
                    </span>

                    <h1>Build better projects together.</h1>

                    <p>
                        Create your account and bring your team's
                        projects, tasks and collaboration into one place.
                    </p>

                    <div className="auth-decoration">
                        <div className="auth-decoration-card">
                            <span>✓</span>
                            Create your workspace
                        </div>
                        <div className="auth-decoration-card">
                            <span>✓</span>
                            Organize your projects
                        </div>
                        <div className="auth-decoration-card">
                            <span>✓</span>
                            Grow with your team
                        </div>
                    </div>
                </div>

                <div className="auth-brand-footer">
                    ProjectHub · SaaS Platform
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-card register-form-card">

                    <div className="auth-mobile-logo">
                        <div className="auth-logo">P</div>
                        <h2>ProjectHub</h2>
                    </div>

                    <span className="auth-form-tag">GET STARTED</span>

                    <h1>Create your account</h1>
                    <p className="auth-description">
                        Fill in your details to join ProjectHub.
                    </p>

                    {error && (
                        <div className="auth-alert auth-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="auth-alert auth-success">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="auth-field">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Choose a username"
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="auth-field-row">

                            <div className="auth-field">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    placeholder="First name"
                                />
                            </div>

                            <div className="auth-field">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    placeholder="Last name"
                                />
                            </div>

                        </div>

                        <div className="auth-field">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="password2"
                                value={formData.password2}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>

                    </form>

                    <div className="auth-bottom-link">
                        Already have an account?
                        <Link to="/login"> Login</Link>
                    </div>

                </div>
            </div>

        </div>
    );
}

export default Register;
