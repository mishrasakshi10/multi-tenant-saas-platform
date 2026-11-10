
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "./AppLayout.css";

function AppLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login");
        }
    };

    const navItems = [
        { path: "/dashboard", label: "Overview", icon: "▦" },
        { path: "/workspaces", label: "Workspaces", icon: "▣" },
        { path: "/projects", label: "Projects", icon: "◫" },
        { path: "/boards", label: "Boards", icon: "▤" },
        { path: "/issues", label: "Issues", icon: "☷" },
        { path: "/kanban", label: "Kanban Board", icon: "▥" },
    ];

    return (
        <div className="app-layout">

            <aside className="app-sidebar">
                <div className="app-brand">
                    <div className="app-brand-icon">P</div>
                    <div>
                        <h2>ProjectHub</h2>
                        <span>WORKSPACE</span>
                    </div>
                </div>

                <div className="app-sidebar-label">MENU</div>

                <nav className="app-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `app-nav-item ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="app-nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="app-sidebar-bottom">
                    <div className="app-sidebar-label">ACCOUNT</div>

                    <button
                        className="app-nav-item app-logout"
                        onClick={handleLogout}
                    >
                        <span className="app-nav-icon">↪</span>
                        Logout
                    </button>

                    <div className="app-sidebar-version">
                        ProjectHub · SaaS Platform
                    </div>
                </div>
            </aside>

            <main className="app-main">
                <Outlet />
            </main>

        </div>
    );
}

export default AppLayout;
