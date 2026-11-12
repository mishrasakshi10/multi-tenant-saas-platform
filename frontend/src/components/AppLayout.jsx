
import { useEffect, useState } from "react";
import {
    NavLink,
    Outlet,
    useNavigate,
    useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import "./AppLayout.css";

function AppLayout() {
    const {
        logout,
        selectedWorkspaceId,
        setSelectedWorkspaceId,
    } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const [workspaces, setWorkspaces] = useState([]);
    const [workspaceLoading, setWorkspaceLoading] = useState(true);

    const getList = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.results)) return data.results;
        return [];
    };

    // LOAD WORKSPACES
    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                const response = await api.get("workspaces/");
                setWorkspaces(getList(response.data));
            } catch (error) {
                console.error("Unable to load workspaces:", error);
            } finally {
                setWorkspaceLoading(false);
            }
        };

        fetchWorkspaces();
    }, []);

    // SET INITIAL / URL-SELECTED WORKSPACE
    useEffect(() => {
        if (workspaceLoading || workspaces.length === 0) return;

        const params = new URLSearchParams(location.search);
        const workspaceFromUrl = params.get("workspace");

        const validWorkspace = (id) =>
            workspaces.some(
                (workspace) => String(workspace.id) === String(id)
            );

        if (workspaceFromUrl && validWorkspace(workspaceFromUrl)) {
            if (String(selectedWorkspaceId) !== String(workspaceFromUrl)) {
                setSelectedWorkspaceId(workspaceFromUrl);
            }
            return;
        }

        if (
            selectedWorkspaceId &&
            validWorkspace(selectedWorkspaceId)
        ) {
            return;
        }

        setSelectedWorkspaceId(workspaces[0].id);
    }, [
        workspaceLoading,
        workspaces,
        location.search,
        selectedWorkspaceId,
        setSelectedWorkspaceId,
    ]);

    // CHANGE WORKSPACE
    const handleWorkspaceChange = (event) => {
        const workspaceId = event.target.value;

        setSelectedWorkspaceId(workspaceId);

        // Keep Projects URL compatible with its existing filter
        if (location.pathname === "/projects") {
            navigate(
                workspaceId
                    ? `/projects?workspace=${workspaceId}`
                    : "/projects"
            );
        }
    };

    // LOGOUT
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

                {/* WORKSPACE SWITCHER */}
                <div style={{ padding: "18px 16px 10px" }}>
                    <label
                        htmlFor="global-workspace"
                        style={{
                            display: "block",
                            color: "#94a3b8",
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing: "1px",
                            marginBottom: "9px",
                        }}
                    >
                        CURRENT WORKSPACE
                    </label>

                    <select
                        id="global-workspace"
                        value={selectedWorkspaceId || ""}
                        onChange={handleWorkspaceChange}
                        disabled={workspaceLoading || workspaces.length === 0}
                        style={{
                            width: "100%",
                            padding: "11px 10px",
                            borderRadius: "8px",
                            border: "1px solid #334155",
                            background: "#1e293b",
                            color: "#f8fafc",
                            fontSize: "13px",
                            outline: "none",
                            cursor: "pointer",
                        }}
                    >
                        {workspaceLoading ? (
                            <option value="">Loading workspaces...</option>
                        ) : workspaces.length === 0 ? (
                            <option value="">No workspaces available</option>
                        ) : (
                            workspaces.map((workspace) => (
                                <option
                                    key={workspace.id}
                                    value={workspace.id}
                                >
                                    {workspace.name}
                                </option>
                            ))
                        )}
                    </select>
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
                            <span className="app-nav-icon">
                                {item.icon}
                            </span>

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
